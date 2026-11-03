import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Authorization token is missing.");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized user.");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verify administrator role
    const { data: adminProfile, error: adminError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      adminError ||
      !["admin", "super_admin"].includes(adminProfile?.role)
    ) {
      throw new Error("Only administrators can approve applications.");
    }

    const { application_id } = await req.json();

    if (!application_id) {
      throw new Error("Application ID is required.");
    }

    // Fetch application
    const { data: application, error: applicationError } = await admin
      .from("student_applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (applicationError || !application) {
      throw new Error("Application not found.");
    }

    if (application.payment_status !== "verified") {
      throw new Error("Please verify payment before approval.");
    }

    if (application.application_status === "rejected") {
      throw new Error("Rejected applications cannot be approved.");
    }

    const email = String(application.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      throw new Error("Student email is missing.");
    }

    // Check whether the profile already exists
    const { data: existingProfile, error: profileLookupError } =
      await admin
        .from("profiles")
        .select("id, role")
        .ilike("email", email)
        .maybeSingle();

    if (profileLookupError) {
      throw new Error(profileLookupError.message);
    }

    let studentId = existingProfile?.id;
    let temporaryPassword: string | null = null;

    if (existingProfile && existingProfile.role !== "student") {
      throw new Error(
        "This email already belongs to an administrator account."
      );
    }

    // Create Auth user and profile if they do not exist
    if (!studentId) {
      temporaryPassword =
        `Av${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}!`;

      const { data: authData, error: authCreateError } =
        await admin.auth.admin.createUser({
          email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: application.full_name || "",
          },
        });

      if (authCreateError || !authData.user) {
        throw new Error(
          authCreateError?.message || "Unable to create student account."
        );
      }

      studentId = authData.user.id;

      const { error: profileInsertError } = await admin
        .from("profiles")
        .insert({
          id: studentId,
          role: "student",
          full_name: application.full_name || "",
          email,
          phone: application.phone || "",
        });

      if (profileInsertError) {
        await admin.auth.admin.deleteUser(studentId);
        throw new Error(profileInsertError.message);
      }
    }

    // Approve application
    const { error: updateError } = await admin
      .from("student_applications")
      .update({
        application_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", application_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        student_id: studentId,
        temporary_password: temporaryPassword,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error occurred.",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});