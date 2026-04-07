import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ONESIGNAL_APP_ID = "15532f0a-ecb3-4cb1-afd4-b810b67edb32";

interface PushPayload {
  user_id: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, string>;
}

async function sendOneSignalPush(payload: PushPayload) {
  const restApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
  if (!restApiKey) throw new Error("ONESIGNAL_REST_API_KEY not set");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get player IDs for the user
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("player_id")
    .eq("user_id", payload.user_id);

  if (error) {
    console.error("Failed to fetch subscriptions:", error);
    return { success: false, error: "Failed to fetch subscriptions" };
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log("No push subscriptions found for user:", payload.user_id);
    return { success: true, sent: 0 };
  }

  const playerIds = subscriptions.map((s: any) => s.player_id);

  const body: Record<string, any> = {
    app_id: ONESIGNAL_APP_ID,
    include_subscription_ids: playerIds,
    headings: { en: payload.title },
    contents: { en: payload.message },
  };

  if (payload.url) {
    body.url = payload.url;
  }
  if (payload.data) {
    body.data = payload.data;
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${restApiKey}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("OneSignal API error:", result);
    return { success: false, error: result };
  }

  console.log("OneSignal push sent:", result);
  return { success: true, sent: playerIds.length, result };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated or service role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getUser();
    if (claimsError || !claimsData?.user) {
      // Allow service role calls (from triggers/webhooks)
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const token = authHeader.replace("Bearer ", "");
      if (token !== serviceRoleKey) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload: PushPayload = await req.json();

    if (!payload.user_id || !payload.title || !payload.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendOneSignalPush(payload);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Push notification error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
