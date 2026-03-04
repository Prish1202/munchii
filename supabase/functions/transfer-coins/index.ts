import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get sender
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: sender }, error: authErr } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !sender) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { username, coins } = await req.json();

    // Validate input
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Username is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (typeof coins !== "number" || !Number.isFinite(coins) || coins < 10) {
      return new Response(JSON.stringify({ error: "Minimum transfer is 10 coins" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (coins !== Math.floor(coins)) {
      return new Response(JSON.stringify({ error: "Coins must be a whole number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for secure operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Find recipient by username
    const { data: recipient, error: recipErr } = await adminClient
      .from("profiles")
      .select("id, name, username")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (recipErr || !recipient) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (recipient.id === sender.id) {
      return new Response(JSON.stringify({ error: "Cannot transfer to yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check sender balance
    const { data: senderWallet } = await adminClient
      .from("user_wallet")
      .select("total_coins")
      .eq("user_id", sender.id)
      .single();

    if (!senderWallet || senderWallet.total_coins < coins) {
      return new Response(JSON.stringify({ error: "Insufficient balance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure recipient wallet exists
    await adminClient
      .from("user_wallet")
      .upsert({ user_id: recipient.id, total_coins: 0 }, { onConflict: "user_id", ignoreDuplicates: true });

    // Deduct from sender
    const { error: deductErr } = await adminClient.rpc("transfer_coins", {
      _sender_id: sender.id,
      _recipient_id: recipient.id,
      _coins: coins,
    });

    if (deductErr) {
      // Fallback: manual updates if RPC doesn't exist yet
      const { error: e1 } = await adminClient
        .from("user_wallet")
        .update({ total_coins: senderWallet.total_coins - coins, updated_at: new Date().toISOString() })
        .eq("user_id", sender.id);
      if (e1) throw e1;

      const { data: recipWallet } = await adminClient
        .from("user_wallet")
        .select("total_coins")
        .eq("user_id", recipient.id)
        .single();

      const { error: e2 } = await adminClient
        .from("user_wallet")
        .update({ total_coins: (recipWallet?.total_coins || 0) + coins, updated_at: new Date().toISOString() })
        .eq("user_id", recipient.id);
      if (e2) throw e2;
    }

    // Log transactions for both users
    await adminClient.from("coin_transactions").insert([
      { user_id: sender.id, coins, type: "transfer" },
      { user_id: recipient.id, coins, type: "earn" },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${coins} coins to @${recipient.username || recipient.name}`,
        recipientName: recipient.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Transfer error:", err);
    return new Response(JSON.stringify({ error: "Transfer failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
