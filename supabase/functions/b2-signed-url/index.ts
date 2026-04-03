const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

const B2_KEY_ID = Deno.env.get('B2_KEY_ID')!
const B2_APP_KEY = Deno.env.get('B2_APP_KEY')!
const B2_BUCKET_NAME = Deno.env.get('B2_BUCKET_NAME') || 'Munchii'
const B2_ENDPOINT = Deno.env.get('B2_ENDPOINT') || 's3.us-east-005.backblazeb2.com'

// B2 authorize account cache
let authCache: { apiUrl: string; authToken: string; expires: number } | null = null

async function getB2Auth() {
  if (authCache && Date.now() < authCache.expires) return authCache

  const resp = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: {
      Authorization: 'Basic ' + btoa(`${B2_KEY_ID}:${B2_APP_KEY}`),
    },
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`B2 auth failed: ${err}`)
  }

  const data = await resp.json()
  authCache = {
    apiUrl: data.apiUrl,
    authToken: data.authorizationToken,
    expires: Date.now() + 23 * 60 * 60 * 1000, // 23 hours
  }
  return authCache!
}

async function getUploadUrl() {
  const auth = await getB2Auth()
  
  // First get bucket ID
  const listResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: {
      Authorization: auth.authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accountId: B2_KEY_ID.substring(0, 12), bucketName: B2_BUCKET_NAME }),
  })

  if (!listResp.ok) {
    // Fallback: try using the S3-compatible approach
    throw new Error('Could not list buckets')
  }

  const buckets = await listResp.json()
  const bucket = buckets.buckets?.[0]
  if (!bucket) throw new Error('Bucket not found')

  const uploadResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: auth.authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId: bucket.bucketId }),
  })

  if (!uploadResp.ok) {
    throw new Error('Could not get upload URL')
  }

  return await uploadResp.json()
}

async function getDownloadAuth(filePrefix: string, validDurationInSeconds = 3600) {
  const auth = await getB2Auth()

  // Get bucket ID
  const listResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: {
      Authorization: auth.authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accountId: B2_KEY_ID.substring(0, 12), bucketName: B2_BUCKET_NAME }),
  })

  const buckets = await listResp.json()
  const bucket = buckets.buckets?.[0]
  if (!bucket) throw new Error('Bucket not found')

  const downloadResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      Authorization: auth.authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId: bucket.bucketId,
      fileNamePrefix: filePrefix,
      validDurationInSeconds,
    }),
  })

  if (!downloadResp.ok) throw new Error('Could not get download auth')
  
  const downloadData = await downloadResp.json()
  return {
    downloadUrl: `${auth.apiUrl}/file/${B2_BUCKET_NAME}/${filePrefix}`,
    authorizationToken: downloadData.authorizationToken,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, filePath, contentType, filePrefix } = await req.json()

    if (action === 'upload') {
      if (!filePath || !contentType) {
        return new Response(JSON.stringify({ error: 'filePath and contentType are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const uploadData = await getUploadUrl()
      
      return new Response(JSON.stringify({
        uploadUrl: uploadData.uploadUrl,
        authorizationToken: uploadData.authorizationToken,
        filePath,
        contentType,
        publicUrl: `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${filePath}`,
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
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
