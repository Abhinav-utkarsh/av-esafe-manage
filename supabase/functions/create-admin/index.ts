
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase environment configuration is missing.");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized request." }, 401);
    }

    // Verify the currently logged-in user.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const {
      data: { user: caller },
      error: authError
    } = await userClient.auth.getUser();

    if (authError || !caller) {
      return jsonResponse({ error: "Invalid authentication." }, 401);
    }

    // Privileged client is used only inside this Edge Function.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Only an active Super Admin can create another Admin.
    const { data: callerProfile, error: callerProfileError } =
      await adminClient
        .from("profiles")
        .select("id, role, account_status")
        .eq("id", caller.id)
        .single();

    if (
      callerProfileError ||
      !callerProfile ||
      callerProfile.role !== "super_admin" ||
      callerProfile.account_status !== "active"
    ) {
      return jsonResponse(
        { error: "Only an active Super Admin can create administrators." },
        403
      );
    }

    const body = await req.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    // Validate input.
    if (!fullName || !email || !password || !confirmPassword) {
      return jsonResponse(
        { error: "Please provide all required fields." },
        400
      );
    }

    if (fullName.length > 150) {
      return jsonResponse(
        { error: "Full name must not exceed 150 characters." },
        400
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return jsonResponse({ error: "Please enter a valid email." }, 400);
    }

    if (password.length < 8) {
      return jsonResponse(
        { error: "Password must contain at least 8 characters." },
        400
      );
    }

    if (password !== confirmPassword) {
      return jsonResponse(
        { error: "Passwords do not match." },
        400
      );
    }

    // Check whether this email already has a profile.
    const { data: existingProfile, error: existingProfileError } =
      await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

    if (existingProfileError) {
      throw existingProfileError;
    }

    if (existingProfile) {
      return jsonResponse(
        { error: "An account with this email already exists." },
        409
      );
    }

    // Create an Auth account directly.
    // No invitation or confirmation email is sent.
    const { data: authData, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "admin"
        }
      });

    if (createUserError || !authData.user) {
      throw createUserError || new Error("Unable to create Auth account.");
    }

    const newUserId = authData.user.id;

    // Create the corresponding application profile.
    const { error: profileInsertError } = await adminClient
      .from("profiles")
      .insert({
        id: newUserId,
        full_name: fullName,
        email,
        role: "admin",
        account_status: "active"
      });

    // Roll back the Auth account if profile creation fails.
    if (profileInsertError) {
      await adminClient.auth.admin.deleteUser(newUserId);
      throw profileInsertError;
    }

    return jsonResponse({
      success: true,
      message: "Administrator account created successfully.",
      admin: {
        id: newUserId,
        fullName,
        email,
        role: "admin"
      }
    });

  } catch (error) {
    console.error("Create admin error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
      },
      500
    );
  }
});
