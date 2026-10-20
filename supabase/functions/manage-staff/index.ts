import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
export const staffEmail = (code: string, username: string) =>
  `${code.toLowerCase()}.${username.toLowerCase()}@staff.munchii.in`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    const owner = u?.user;
    if (!owner) return json({ error: "Please sign in again" }, 401);

    const { data: outlet } = await admin.from("restaurants")
      .select("id, outlet_code").eq("owner_id", owner.id).maybeSingle();
    if (!outlet?.outlet_code) return json({ error: "Only outlet owners can manage staff" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "create") {
      const name = String(body.name || "").trim();
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (name.length < 2 || name.length > 60) return json({ error: "Enter the staff member's name" }, 400);
      if (!USERNAME_RE.test(username)) return json({ error: "Username must be 3–20 letters, numbers, _ or ." }, 400);
      if (password.length < 6 || password.length > 72) return json({ error: "Password must be at least 6 characters" }, 400);

      const { data: taken } = await admin.from("restaurant_staff").select("id")
        .eq("restaurant_id", outlet.id).ilike("username", username).maybeSingle();
      if (taken) return json({ error: "This username is already used at your outlet" }, 400);

      const { data: created, error } = await admin.auth.admin.createUser({
        email: staffEmail(outlet.outlet_code, username),
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (error || !created.user) return json({ error: error?.message || "Could not create staff" }, 400);
      const uid = created.user.id;
      await admin.from("user_roles").update({ role: "staff" }).eq("user_id", uid);
      const { error: insErr } = await admin.from("restaurant_staff")
        .insert({ restaurant_id: outlet.id, user_id: uid, name, username });
      if (insErr) {
        await admin.auth.admin.deleteUser(uid);
        return json({ error: insErr.message }, 400);
      }
      return json({ success: true });
    }

    const staffId = String(body.staffId || "");
    const { data: staff } = await admin.from("restaurant_staff").select("id, user_id")
      .eq("id", staffId).eq("restaurant_id", outlet.id).maybeSingle();
    if (!staff) return json({ error: "Staff member not found" }, 404);

    if (action === "remove") {
      await admin.from("restaurant_staff").update({ is_active: false }).eq("id", staff.id);
      await admin.auth.admin.signOut(staff.user_id, "global").catch(() => {});
      await admin.auth.admin.deleteUser(staff.user_id);
      await admin.from("restaurant_staff").delete().eq("id", staff.id);
      return json({ success: true });
    }

    if (action === "reset_password") {
      const password = String(body.password || "");
      if (password.length < 6 || password.length > 72) return json({ error: "Password must be at least 6 characters" }, 400);
      const { error } = await admin.auth.admin.updateUserById(staff.user_id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "Something went wrong" }, 500);
  }
});
