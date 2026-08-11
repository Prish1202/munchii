import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const B2_KEY_ID = Deno.env.get('B2_KEY_ID')!
const B2_APP_KEY = Deno.env.get('B2_APP_KEY')!
const B2_BUCKET_NAME = Deno.env.get('B2_BUCKET_NAME') || 'Munchii'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function b2Auth() {
  const r = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { Authorization: 'Basic ' + btoa(`${B2_KEY_ID}:${B2_APP_KEY}`) },
  })
  if (!r.ok) throw new Error(`B2 auth failed: ${await r.text()}`)
  return await r.json()
}

async function bucketId(auth: any) {
  const r = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: auth.accountId, bucketName: B2_BUCKET_NAME }),
  })
  if (!r.ok) throw new Error(`list_buckets: ${await r.text()}`)
  const b = (await r.json()).buckets?.[0]
  if (!b?.bucketId) throw new Error('Bucket not found')
  return b.bucketId as string
}

async function deleteAllVersions(auth: any, bId: string, filePath: string) {
  const list = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_versions`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: bId, startFileName: filePath, prefix: filePath, maxFileCount: 20 }),
  })
  if (!list.ok) throw new Error(`list_file_versions: ${await list.text()}`)
  const files = (await list.json()).files || []

  let deleted = 0
  for (const f of files) {
    if (f.fileName !== filePath) continue
    const del = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
      method: 'POST',
      headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: f.fileName, fileId: f.fileId }),
    })
    if (del.ok) deleted++
  }
  return deleted
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

  try {
    // Safety net for anything that was opened but never finalized by the client.
    await admin.rpc('sweep_stale_view_once_media')

    const { data: queue, error } = await admin
      .from('media_cleanup_queue')
      .select('id, file_path, attempts')
      .is('processed_at', null)
      .lt('attempts', 5)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error

    const auth = queue?.length ? await b2Auth() : null
    const bId = auth ? await bucketId(auth) : null

    let processed = 0
    for (const row of queue || []) {
      try {
        await deleteAllVersions(auth, bId!, row.file_path)
        await admin
          .from('media_cleanup_queue')
          .update({ processed_at: new Date().toISOString(), attempts: row.attempts + 1 })
          .eq('id', row.id)
        processed++
      } catch (e) {
        await admin
          .from('media_cleanup_queue')
          .update({
            attempts: row.attempts + 1,
            last_error: e instanceof Error ? e.message : 'unknown',
          })
          .eq('id', row.id)
      }
    }

    return new Response(JSON.stringify({ processed, queued: queue?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('media-cleanup error', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
