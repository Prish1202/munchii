import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, range, ' +
    'x-supabase-client-platform, x-supabase-client-platform-version, ' +
    'x-supabase-client-runtime, x-supabase-client-runtime-version, ' +
    'x-b2-file-path, x-b2-content-type',
  'Access-Control-Expose-Headers':
    'Content-Type, Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified',
}

const B2_KEY_ID = Deno.env.get('B2_KEY_ID')
const B2_APP_KEY = Deno.env.get('B2_APP_KEY')
const B2_BUCKET_NAME = Deno.env.get('B2_BUCKET_NAME') || 'Munchii'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')

/* ── helpers ─────────────────────────────────────────────── */

const ALLOWED_READ_PREFIXES = ['u/', 'chat/', 'clubs/', 'pulses/']
const UNSAFE_TYPES = /(html|javascript|ecmascript|svg|xml)/i

function isSafePath(p: string) {
  return !!p && p.length < 512 && !p.includes('..') && !p.startsWith('/') && !p.includes('\\') &&
    /^[A-Za-z0-9._\-\/]+$/.test(p)
}

function sanitizeSegment(s: string) {
  return s.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 100) || 'x'
}

// Confine uploads to the caller's own namespace: u/<userId>/<folder>/<file>
function confinePath(userId: string, requested: string) {
  const parts = requested.split('/').filter((x) => x && x !== '.' && x !== '..').map(sanitizeSegment)
  const file = parts.pop() || `${Date.now()}.bin`
  const folder = parts.slice(0, 5).join('/')
  return `u/${userId}/${folder ? folder + '/' : ''}${file}`
}

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
    .map((s) => encodeURIComponent(s))
    .join('/')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function proxyUrl(filePath: string) {
  return SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/b2-signed-url?filePath=${encodeURIComponent(filePath)}`
    : filePath
}

async function sha1Hex(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-1', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/* ── B2 auth / bucket ───────────────────────────────────── */

async function getB2Auth() {
  if (authCache && Date.now() < authCache.expires) return authCache
  if (!B2_KEY_ID || !B2_APP_KEY) throw new Error('Missing B2 credentials')

  const resp = await fetch(
    'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
    { headers: { Authorization: 'Basic ' + btoa(`${B2_KEY_ID}:${B2_APP_KEY}`) } },
  )
  if (!resp.ok) throw new Error(`B2 auth failed: ${await resp.text()}`)

  const d = await resp.json()
  authCache = {
    accountId: d.accountId,
    apiUrl: d.apiUrl,
    authToken: d.authorizationToken,
    bucketId: null,
    downloadUrl: d.downloadUrl,
    expires: Date.now() + 23 * 3600_000,
  }
  return authCache
}

async function getBucketId() {
  const auth = await getB2Auth()
  if (auth.bucketId) return auth.bucketId

  const r = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: { Authorization: auth.authToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: auth.accountId, bucketName: B2_BUCKET_NAME }),
  })
  if (!r.ok) throw new Error(`list_buckets: ${await r.text()}`)

  const bucket = (await r.json()).buckets?.find(
    (b: { bucketName?: string }) => b.bucketName === B2_BUCKET_NAME,
  )
  if (!bucket?.bucketId) throw new Error(`Bucket "${B2_BUCKET_NAME}" not found`)

  authCache = { ...auth, bucketId: bucket.bucketId }
  return bucket.bucketId as string
}

async function getUploadUrl() {
  const auth = await getB2Auth()
  const bucketId = await getBucketId()
  const r = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: { Authorization: auth.authToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId }),
  })
  if (!r.ok) throw new Error(`get_upload_url: ${await r.text()}`)
  return await r.json()
}

/* ── server-side upload relay ────────────────────────────── */

async function uploadToB2(filePath: string, contentType: string, buf: ArrayBuffer) {
  const up = await getUploadUrl()
  const r = await fetch(up.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: up.authorizationToken,
      'Content-Type': contentType,
      'X-Bz-File-Name': encodeUrlPath(filePath),
      'X-Bz-Content-Sha1': await sha1Hex(buf),
    },
    body: new Uint8Array(buf),
  })
  if (!r.ok) throw new Error(`B2 upload: ${await r.text()}`)
  return proxyUrl(filePath)
}

/* ── download proxy (public, no auth needed) ─────────────── */

async function proxyDownload(req: Request, filePath: string) {
  const auth = await getB2Auth()
  const hdrs = new Headers({ Authorization: auth.authToken })
  const range = req.headers.get('range')
  if (range) hdrs.set('Range', range)

  const upstream = await fetch(
    `${auth.downloadUrl}/file/${B2_BUCKET_NAME}/${encodeUrlPath(filePath)}`,
    { method: req.method, headers: hdrs },
  )
  if (!upstream.ok && upstream.status !== 206) {
    return json({ error: 'Not found' }, 404)
  }

  const out = new Headers(corsHeaders)
  for (const h of [
    'content-type', 'content-length', 'content-range',
    'accept-ranges', 'etag', 'last-modified',
  ]) {
    const v = upstream.headers.get(h)
    if (v) out.set(h, v)
  }
  out.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(req.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: out,
  })
}

/* ── Supabase user auth ──────────────────────────────────── */

async function getUser(req: Request) {
  const auth = req.headers.get('Authorization')
  if (!auth) return null
  const sb = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user }, error } = await sb.auth.getUser()
  return error ? null : user
}

/* ── main handler ────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !B2_KEY_ID || !B2_APP_KEY) {
      console.error('Missing env vars')
      return json({ error: 'Server configuration error' }, 500)
    }

    const url = new URL(req.url)
    const qFilePath = url.searchParams.get('filePath')

    // ── GET/HEAD ?filePath=… → proxy download (public, no auth) ──
    if ((req.method === 'GET' || req.method === 'HEAD') && qFilePath) {
      if (!isSafePath(qFilePath) || !ALLOWED_READ_PREFIXES.some((p) => qFilePath.startsWith(p))) {
        return json({ error: 'Not found' }, 404)
      }
      return await proxyDownload(req, qFilePath)
    }

    // ── POST with x-b2-file-path header → server-side upload relay ──
    const headerPath = req.headers.get('x-b2-file-path')
    if (req.method === 'POST' && headerPath) {
      const user = await getUser(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)

      const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
      const declared = Number(req.headers.get('content-length') || '0')
      if (declared > MAX_UPLOAD_BYTES) return json({ error: 'File too large (max 50 MB)' }, 413)
      const buf = await req.arrayBuffer()
      if (buf.byteLength > MAX_UPLOAD_BYTES) return json({ error: 'File too large (max 50 MB)' }, 413)
      if (!buf.byteLength) return json({ error: 'Empty file body' }, 400)

      let ct =
        req.headers.get('x-b2-content-type') ||
        req.headers.get('content-type') ||
        'application/octet-stream'
      // Never store content that browsers could execute as a web page/script.
      if (UNSAFE_TYPES.test(ct) || !/^[\w.+-]+\/[\w.+-]+$/.test(ct)) ct = 'application/octet-stream'

      const safePath = confinePath(user.id, headerPath)
      const publicUrl = await uploadToB2(safePath, ct, buf)
      return json({ publicUrl, filePath: safePath, contentType: ct })
    }

    // ── Legacy JSON body actions (kept for backward compat) ──
    const user = await getUser(req)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => null)
    if (body?.action === 'upload' && body.filePath && body.contentType) {
      return json({ publicUrl: proxyUrl(body.filePath), filePath: body.filePath, contentType: body.contentType })
    }
    if (body?.action === 'download' && body.filePrefix) {
      return json({ proxyUrl: proxyUrl(body.filePrefix) })
    }

    return json({ error: 'Invalid request' }, 400)
  } catch (err) {
    console.error('b2-signed-url error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})
