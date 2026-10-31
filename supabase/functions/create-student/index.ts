
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      405
    );
  }

  let createdUserId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(
        { error: "Supabase environment configuration is missing." },
        500
      );
    }

    // Verify the logged-in administrator.
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Unauthorized request." },
        401
      );
    }

    const accessToken = authHeader.slice("Bearer ".length);

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const {
      data: { user: caller },
      error: authError
    } = await userClient.auth.getUser(accessToken);

    if (authError || !caller) {
      return jsonResponse(
        { error: "Invalid authentication." },
        401
      );
    }

    // Privileged client. Service-role key stays server-side.
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Only active Admins and Super Admins can create students.
    const { data: callerProfile, error: callerError } =
      await adminClient
        .from("profiles")
        .select("id, role, account_status")
        .eq("id", caller.id)
        .single();

    if (
      callerError ||
      !callerProfile ||
      !["admin", "super_admin"].includes(callerProfile.role) ||
      callerProfile.account_status !== "active"
    ) {
      return jsonResponse(
        {
          error:
            "Only active administrators can create student accounts."
        },
        403
      );
    }

    const body = await req.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    // Validate required fields.
    if (!fullName || !email || !password || !confirmPassword) {
      return jsonResponse(
        {
          error:
            "Full name, email, password and confirm password are required."
        },
        400
      );
    }

    if (fullName.length > 150) {
      return jsonResponse(
        { error: "Full name must not exceed 150 characters." },
        400
      );
    }

    if (phone.length > 30) {
      return jsonResponse(
        { error: "Phone number must not exceed 30 characters." },
        400
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return jsonResponse(
        { error: "Please enter a valid email address." },
        400
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        { error: "Password must contain at least 8 characters." },
        400
      );
    }

    if (password !== confirmPassword) {
      return jsonResponse(
        { error: "Password and Confirm Password do not match." },
        400
      );
    }

    // Check for an existing Academy profile.
    const { data: existingProfile, error: existingError } =
      await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingProfile) {
      return jsonResponse(
        {
          error:
            "An Academy account already exists with this email address."
        },
        409
      );
    }

    // Create Auth account directly.
    // No invitation or recovery email is sent.
    const { data: authData, error: createAuthError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      });

    if (createAuthError) {
      console.error(
        "Student Auth creation failed:",
        createAuthError.message
      );

      return jsonResponse(
        { error: createAuthError.message },
        400
      );
    }

    if (!authData.user) {
      return jsonResponse(
        {
          error:
            "Supabase did not return the newly created user."
        },
        500
      );
    }

    createdUserId = authData.user.id;

    // Create the matching Academy profile.
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: createdUserId,
        full_name: fullName,
        email,
        phone: phone || null,
        role: "student",
        account_status: "active"
      });

    if (profileError) {
      console.error(
        "Student profile creation failed:",
        profileError.message
      );

      // Roll back Auth account if profile creation fails.
      const { error: rollbackError } =
        await adminClient.auth.admin.deleteUser(createdUserId);

      if (rollbackError) {
        console.error(
          "Student rollback failed:",
          rollbackError.message
        );
      }

      createdUserId = null;

      return jsonResponse(
        {
          error:
            "Student profile could not be created. Please check the database configuration."
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      message:
        "Student account created successfully. No invitation email was sent.",
      student: {
        id: createdUserId,
        fullName,
        email,
        phone: phone || null,
        role: "student"
      }
    });

  } catch (error) {
    console.error("Create student error:", error);

    // Best-effort rollback for unexpected errors.
    if (createdUserId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

      if (supabaseUrl && serviceRoleKey) {
        const adminClient = createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false
            }
          }
        );

        const { error: rollbackError } =
          await adminClient.auth.admin.deleteUser(createdUserId);

        if (rollbackError) {
          console.error(
            "Unexpected-error rollback failed:",
            rollbackError.message
          );
        }
      }
    }

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
