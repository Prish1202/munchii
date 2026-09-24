import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { username, password } = await req.json();
    if (!username || !password) return json({ error: "Username and password are required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const handle = String(username).trim().replace(/^@/, "").toLowerCase();

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", handle)
      .maybeSingle();

    // Generic error so we never reveal whether a username exists
    const invalid = () => json({ error: "Invalid username or password" }, 401);
    if (!profile) return invalid();

    // Only Foodie (customer) accounts may sign in with a username
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (roleRow?.role !== "customer") return invalid();

    const { data: userRes } = await admin.auth.admin.getUserById(profile.id);
    const email = userRes?.user?.email;
    if (!email) return invalid();

    const anon = createClient(supabaseUrl, anonKey);
    const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !signIn.session) return invalid();

    return json({
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    });
  } catch (e) {
    console.error("username-login error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
