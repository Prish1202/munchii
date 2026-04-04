import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const B2_KEY_ID = Deno.env.get('B2_KEY_ID')
const B2_APP_KEY = Deno.env.get('B2_APP_KEY')
const B2_BUCKET_NAME = Deno.env.get('B2_BUCKET_NAME') || 'Munchii'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')

let authCache: {
  accountId: string
  apiUrl: string
  authToken: string
  bucketId: string | null
  downloadUrl: string
  expires: number
} | null = null

function encodeUrlPath(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

async function getB2Auth() {
  if (authCache && Date.now() < authCache.expires) return authCache

  if (!B2_KEY_ID || !B2_APP_KEY) {
    throw new Error('Missing Backblaze B2 credentials')
  }

  const resp = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: {
      Authorization: 'Basic ' + btoa(`${B2_KEY_ID}:${B2_APP_KEY}`),
    },
  })

  if (!resp.ok) {
    throw new Error(`B2 auth failed: ${await resp.text()}`)
  }

  const data = await resp.json()
  authCache = {
    accountId: data.accountId,
    apiUrl: data.apiUrl,
    authToken: data.authorizationToken,
    bucketId: null,
    downloadUrl: data.downloadUrl,
    expires: Date.now() + 23 * 60 * 60 * 1000,
  }

  return authCache
}

async function getBucketId() {
  const auth = await getB2Auth()
  if (auth.bucketId) return auth.bucketId

  const listResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: {
      Authorization: auth.authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountId: auth.accountId,
      bucketName: B2_BUCKET_NAME,
    }),
  })

  if (!listResp.ok) {
    throw new Error(`Could not list buckets: ${await listResp.text()}`)
  }

  const data = await listResp.json()
  const bucket = data.buckets?.find((entry: { bucketId?: string; bucketName?: string }) => entry.bucketName === B2_BUCKET_NAME)

  if (!bucket?.bucketId) {
    throw new Error(`Bucket "${B2_BUCKET_NAME}" not found`)
  }

  authCache = { ...auth, bucketId: bucket.bucketId }
  return bucket.bucketId
}

async function getUploadUrl() {
  const auth = await getB2Auth()
  const bucketId = await getBucketId()

  const uploadResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: auth.authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId }),
  })

  if (!uploadResp.ok) {
    throw new Error(`Could not get upload URL: ${await uploadResp.text()}`)
  }

  return await uploadResp.json()
}

async function getDownloadAuth(filePrefix: string, validDurationInSeconds = 3600) {
  const auth = await getB2Auth()
  const bucketId = await getBucketId()

  const downloadResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      Authorization: auth.authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId,
      fileNamePrefix: filePrefix,
      validDurationInSeconds,
    }),
  })

  if (!downloadResp.ok) {
    throw new Error(`Could not get download auth: ${await downloadResp.text()}`)
  }

  const downloadData = await downloadResp.json()
  return {
    downloadUrl: `${auth.downloadUrl}/file/${B2_BUCKET_NAME}/${encodeUrlPath(filePrefix)}`,
    authorizationToken: downloadData.authorizationToken,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !B2_KEY_ID || !B2_APP_KEY) {
      console.error('Missing environment variables', {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseAnonKey: !!SUPABASE_ANON_KEY,
        hasB2KeyId: !!B2_KEY_ID,
        hasB2AppKey: !!B2_APP_KEY,
      })

      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    const action = body?.action
    const filePath = body?.filePath
    const contentType = body?.contentType
    const filePrefix = body?.filePrefix

    if (action === 'upload') {
      if (!filePath || !contentType) {
        return new Response(JSON.stringify({ error: 'filePath and contentType are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const [uploadData, auth] = await Promise.all([getUploadUrl(), getB2Auth()])

      return new Response(JSON.stringify({
        uploadUrl: uploadData.uploadUrl,
        authorizationToken: uploadData.authorizationToken,
        filePath,
        contentType,
        publicUrl: `${auth.downloadUrl}/file/${B2_BUCKET_NAME}/${encodeUrlPath(filePath)}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'download') {
      if (!filePrefix) {
        return new Response(JSON.stringify({ error: 'filePrefix is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const downloadData = await getDownloadAuth(filePrefix)

      return new Response(JSON.stringify(downloadData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "upload" or "download"' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('B2 signed URL error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
