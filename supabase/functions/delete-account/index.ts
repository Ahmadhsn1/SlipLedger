import { createClient } from "npm:@supabase/supabase-js@2.89.0";
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token) return new Response(null, { status: 401 });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return new Response(null, { status: 401 });
  const removed = await admin.storage
    .from("workspaces")
    .remove([data.user.id + "/backup.zip"]);
  if (removed.error) return new Response(null, { status: 503 });
  const deleted = await admin.auth.admin.deleteUser(data.user.id);
  return new Response(JSON.stringify({ deleted: !deleted.error }), {
    status: deleted.error ? 503 : 200,
    headers: { "Content-Type": "application/json" },
  });
});
