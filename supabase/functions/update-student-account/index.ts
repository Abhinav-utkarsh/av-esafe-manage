
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200
) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed." },
      405
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { success: false, error: "Unauthorized request." },
        401
      );
    }

    // Verify the logged-in administrator.
    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user: currentUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !currentUser) {
      return jsonResponse(
        { success: false, error: "Invalid authentication." },
        401
      );
    }

    // Service-role client for protected administrative operations.
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Verify administrator role from the profiles table.
    const { data: adminProfile, error: roleError } =
      await adminClient
        .from("profiles")
        .select("id, role")
        .eq("id", currentUser.id)
        .single();

    if (
      roleError ||
      !adminProfile ||
      !["admin", "super_admin"].includes(adminProfile.role)
    ) {
      return jsonResponse(
        {
          success: false,
          error: "You do not have permission to update student accounts.",
        },
        403
      );
    }

    const body = await req.json();

    const studentId = body.studentId;
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim() || "";
    const password = body.password;

    if (!studentId || !fullName || !email) {
      return jsonResponse(
        {
          success: false,
          error: "Student ID, name, and email are required.",
        },
        400
      );
    }

    if (typeof fullName !== "string" || fullName.length > 100) {
      return jsonResponse(
        {
          success: false,
          error: "Student name must be 100 characters or fewer.",
        },
        400
      );
    }

    if (typeof phone !== "string" || phone.length > 20) {
      return jsonResponse(
        {
          success: false,
          error: "Phone number must be 20 characters or fewer.",
        },
        400
      );
    }

    if (
      password !== null &&
      password !== undefined &&
      password !== "" &&
      (typeof password !== "string" || password.length < 8)
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Password must contain at least 8 characters.",
        },
        400
      );
    }

    // Confirm the target is an existing student.
    const { data: studentProfile, error: studentError } =
      await adminClient
        .from("profiles")
        .select("id, role, email")
        .eq("id", studentId)
        .eq("role", "student")
        .single();

    if (studentError || !studentProfile) {
      return jsonResponse(
        {
          success: false,
          error: "Student account not found.",
        },
        404
      );
    }

    // Email is intentionally immutable.
    if (
      studentProfile.email?.toLowerCase() !== email
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Student email address cannot be changed.",
        },
        400
      );
    }

    // Update profile details.
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
      })
      .eq("id", studentId)
      .eq("role", "student");

    if (profileUpdateError) {
      console.error(
        "Profile update error:",
        profileUpdateError
      );

      return jsonResponse(
        {
          success: false,
          error: "Unable to update student profile.",
        },
        500
      );
    }

    // Update Auth password only if a new password was entered.
    if (password) {
      const { error: passwordUpdateError } =
        await adminClient.auth.admin.updateUserById(
          studentId,
          {
            password,
          }
        );

      if (passwordUpdateError) {
        console.error(
          "Password update error:",
          passwordUpdateError
        );

        return jsonResponse(
          {
            success: false,
            error:
              "Profile updated, but password change failed. Please retry.",
          },
          500
        );
      }
    }

    return jsonResponse({
      success: true,
      message: password
        ? "Student profile and password updated successfully."
        : "Student profile updated successfully.",
    });
  } catch (error) {
    console.error("Unexpected error:", error);

    return jsonResponse(
      {
        success: false,
        error: "An unexpected error occurred.",
      },
      500
    );
  }
});
