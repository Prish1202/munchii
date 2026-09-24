import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const esc = (v: unknown) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const reporterId = user.id;
    const uuidRe = /^[0-9a-f-]{36}$/i;
    const reportedUserId = typeof body.reportedUserId === 'string' && uuidRe.test(body.reportedUserId) ? body.reportedUserId : null;
    const reportType = esc(String(body.reportType || 'other').slice(0, 50));
    const reason = esc(String(body.reason || '').slice(0, 2000));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get reporter info
    let reporterName = 'Unknown';
    if (reporterId) {
      const { data: reporter } = await supabaseAdmin
        .from('profiles')
        .select('name, username')
        .eq('id', reporterId)
        .single();
      if (reporter) reporterName = esc(reporter.username || reporter.name);
    }

    let reportedName = 'N/A';
    if (reportedUserId) {
      const { data: reported } = await supabaseAdmin
        .from('profiles')
        .select('name, username')
        .eq('id', reportedUserId)
        .single();
      if (reported) reportedName = esc(reported.username || reported.name);
    }

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Munchii Reports <onboarding@resend.dev>',
          to: ['munchii.in.prm@gmail.com'],
          subject: `[Abuse Report] ${reportType} - by @${reporterName}`,
          html: `
            <h2>New Abuse Report</h2>
            <p><strong>Type:</strong> ${reportType}</p>
            <p><strong>Reporter:</strong> @${reporterName} (${reporterId})</p>
            <p><strong>Reported User:</strong> @${reportedName} (${reportedUserId || 'N/A'})</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
