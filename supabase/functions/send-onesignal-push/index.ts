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

  console.log("[Push] Fetching subscriptions for user:", payload.user_id);
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("player_id")
    .eq("user_id", payload.user_id);

  if (error) {
    console.error("[Push] Failed to fetch subscriptions:", error);
    return { success: false, error: "Failed to fetch subscriptions" };
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log("[Push] No push subscriptions found for user:", payload.user_id);
    return { success: true, sent: 0 };
  }

  const playerIds = subscriptions.map((s: any) => s.player_id);
  console.log("[Push] Sending to player_ids:", playerIds);

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
    console.error("[Push] OneSignal API error:", JSON.stringify(result));
    return { success: false, error: result };
  }

  console.log("[Push] OneSignal push sent successfully:", JSON.stringify(result));
  return { success: true, sent: playerIds.length, result };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

    // Known anon key used by the DB trigger
    const KNOWN_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YXJpdW1wZGpxZmFqbHRxcXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODAzODYsImV4cCI6MjA4MjI1NjM4Nn0.XjmUdcLVwToapulAmREZZKzWDyCJQhbQIlVe6nZnbEM";

    const isKnownKey = token === serviceRoleKey || token === anonKey || token === publishableKey || token === KNOWN_ANON_KEY;

    if (!isKnownKey) {
      // Try to validate as user JWT
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) {
        console.error("[Push] Auth failed:", authError?.message || "no user");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("[Push] Authenticated as user:", userData.user.id);
    } else {
      console.log("[Push] Authenticated via", isServiceRole ? "service_role" : isAnonKey ? "anon_key" : "publishable_key");
    }

    const payload: PushPayload = await req.json();
    console.log("[Push] Received payload:", JSON.stringify(payload));

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
    console.error("[Push] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
