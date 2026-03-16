import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reporterId, reportedUserId, reportType, reason } = await req.json();

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
      if (reporter) reporterName = reporter.username || reporter.name;
    }

    let reportedName = 'N/A';
    if (reportedUserId) {
      const { data: reported } = await supabaseAdmin
        .from('profiles')
        .select('name, username')
        .eq('id', reportedUserId)
        .single();
      if (reported) reportedName = reported.username || reported.name;
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
