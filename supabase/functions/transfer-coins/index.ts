import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_TRANSFERS_PER_HOUR = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    const senderId = claimsData?.claims?.sub;
    if (claimsErr || !senderId) return json({ error: "Invalid token" }, 401);

    const { username, coins } = await req.json();

    // Input validation
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return json({ error: "Username is required" }, 400);
    }
    const cleanUsername = username.trim().replace(/^@+/, "").toLowerCase();

    if (typeof coins !== "number" || !Number.isFinite(coins) || coins < 10) {
      return json({ error: "Minimum transfer is 10 coins" }, 400);
    }
    if (coins !== Math.floor(coins)) {
      return json({ error: "Coins must be a whole number" }, 400);
    }
    if (coins > 10000) {
      return json({ error: "Maximum transfer is 10,000 coins" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Rate limiting: max 10 transfers per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentTransfers } = await adminClient
      .from("coin_transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", senderId)
      .eq("type", "transfer")
      .gte("created_at", oneHourAgo);

    if ((recentTransfers || 0) >= MAX_TRANSFERS_PER_HOUR) {
      return json({ error: "Rate limit exceeded. Max 10 transfers per hour." }, 429);
    }

    // Find recipient
    const { data: recipient, error: recipErr } = await adminClient
      .from("profiles")
      .select("id, name, username")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (recipErr || !recipient) return json({ error: "User not found" }, 404);
    if (recipient.id === senderId) return json({ error: "Cannot transfer to yourself" }, 400);

    // Atomic transfer using the DB function
    const { error: transferErr } = await adminClient.rpc("transfer_coins", {
      _sender_id: senderId,
      _recipient_id: recipient.id,
      _coins: coins,
    });

    if (transferErr) {
      console.error("Transfer RPC error:", transferErr);
      if (transferErr.message.includes("Insufficient")) {
        return json({ error: "Insufficient balance" }, 400);
      }
      return json({ error: "Transfer failed. Please try again." }, 500);
    }

    // Log transactions for both users
    await adminClient.from("coin_transactions").insert([
      { user_id: senderId, coins, type: "transfer" },
      { user_id: recipient.id, coins, type: "earn" },
    ]);

    return json({
      success: true,
      message: `Sent ${coins} coins to @${recipient.username || recipient.name}`,
      recipientName: recipient.name,
    });
  } catch (err) {
    console.error("Transfer error:", err);
    return json({ error: "Transfer failed. Please try again." }, 500);
  }
});
