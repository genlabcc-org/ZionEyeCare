import { S3Client, PutObjectCommand, DeleteObjectCommand } from "npm:@aws-sdk/client-s3";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${Deno.env.get("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
  },
});

async function requireAdmin(req: Request): Promise<{ ok: boolean; status?: number; error?: string }> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Authorization header" };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: "Empty bearer token" };
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }

  const metaRole = String(
    user.app_metadata?.role || user.user_metadata?.role || ""
  ).trim().toLowerCase();
  if (metaRole === "admin" || metaRole === "super admin") {
    return { ok: true };
  }

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const dbRole = String(dbUser?.role || "").trim().toLowerCase();
  if (dbRole === "admin" || dbRole === "super admin") {
    return { ok: true };
  }

  return { ok: false, status: 403, error: "Admin access required" };
}

function isSafeKey(key: string): boolean {
  return Boolean(key) && !key.includes("..") && !key.startsWith("/");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authCheck = await requireAdmin(req);
    if (!authCheck.ok) {
      return new Response(JSON.stringify({ error: authCheck.error }), {
        status: authCheck.status || 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { filePath } = await req.json();
      if (!filePath || !isSafeKey(filePath)) {
        return new Response(JSON.stringify({ error: "Invalid or missing filePath" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await r2.send(new DeleteObjectCommand({
        Bucket: Deno.env.get("R2_BUCKET_NAME"),
        Key: filePath,
      }));

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const filePath = String(formData.get("filePath") || "");
    const cacheControl = (formData.get("cacheControl") as string) || "3600";

    if (!file || !isSafeKey(filePath)) {
      return new Response(JSON.stringify({ error: "Invalid or missing file or filePath" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: Deno.env.get("R2_BUCKET_NAME"),
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
      CacheControl: `public, max-age=${cacheControl}`,
    }));

    const publicUrl = `${Deno.env.get("R2_PUBLIC_URL")}/${filePath}`;
    return new Response(JSON.stringify({ publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
