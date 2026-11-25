import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";
import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") || "zion-eyecare";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCorsPreflight(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";

    let tokenEmail = "";
    let cleanName = "";
    let tokenPhone = "";

    if (idToken) {
      // Cryptographically verify Firebase ID token using Google's public JWKS
      let payload: Record<string, unknown>;
      try {
        const verified = await jwtVerify(idToken, FIREBASE_JWKS, {
          issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
          audience: FIREBASE_PROJECT_ID,
        });
        payload = verified.payload as Record<string, unknown>;
      } catch (verifyErr) {
        console.warn("[google-auth-sync] Invalid Firebase ID token:", verifyErr);
        return new Response(JSON.stringify({ error: "Invalid or expired Firebase ID token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      tokenEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      const emailVerified = payload.email_verified === true;
      tokenPhone = typeof payload.phone_number === "string" ? payload.phone_number.trim() : "";
      const tokenName = typeof payload.name === "string" ? payload.name.trim() : "";

      if (!tokenEmail || !emailVerified) {
        return new Response(JSON.stringify({ error: "Verified email is required on Google account" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      cleanName = tokenName || tokenEmail.split("@")[0] || "User";
    } else if (typeof body.email === "string" && body.email.includes("@")) {
      // Direct user/admin provision without Firebase token
      tokenEmail = body.email.trim().toLowerCase();
      cleanName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : tokenEmail.split("@")[0];
      tokenPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    } else {
      return new Response(JSON.stringify({ error: "Missing Firebase idToken or email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Generate magiclink / signup OTP without sending any email
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: tokenEmail,
      options: {
        data: {
          name: cleanName,
          phone: tokenPhone || undefined,
        },
      },
    });

    if (linkError) {
      console.error("Error generating auth link:", linkError);
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = linkData?.user?.id;

    // 2. Ensure row in public.users table exists while preserving existing role
    if (userId) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("role, name, phone")
        .eq("id", userId)
        .maybeSingle();

      const userRole = existingUser?.role || "user";
      const userName = existingUser?.name || cleanName;
      const userPhone = tokenPhone || existingUser?.phone || "No phone set";

      await supabaseAdmin.from("users").upsert(
        {
          id: userId,
          email: tokenEmail,
          name: userName,
          phone: userPhone,
          role: userRole,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        hashed_token: linkData.properties.hashed_token,
        verification_type: linkData.properties.verification_type,
        userId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Server error in google-auth-sync:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
