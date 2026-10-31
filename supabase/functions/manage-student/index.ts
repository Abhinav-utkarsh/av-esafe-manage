
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
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

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
      return jsonResponse({ error: "Unauthorized request." }, 401);
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
      return jsonResponse({ error: "Invalid authentication." }, 401);
    }

    // Privileged server-side client.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Only active administrators can manage student accounts.
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
        { error: "Only active administrators can manage student accounts." },
        403
      );
    }

    const body = await req.json();

    const action = String(body.action || "").trim().toLowerCase();

    // Accept the common frontend ID property names.
    const studentId = String(
      body.studentId || body.userId || body.targetId || ""
    ).trim();

    if (!studentId) {
      return jsonResponse({ error: "Student ID is required." }, 400);
    }

    if (!["deactivate", "reactivate", "delete"].includes(action)) {
      return jsonResponse({ error: "Invalid student management action." }, 400);
    }

    // Find the target profile and ensure it is a student.
    const { data: student, error: studentError } =
      await adminClient
        .from("profiles")
        .select("id, full_name, email, role, account_status")
        .eq("id", studentId)
        .single();

    if (studentError || !student) {
      return jsonResponse({ error: "Student account was not found." }, 404);
    }

    if (student.role !== "student") {
      return jsonResponse(
        { error: "This operation is only allowed for student accounts." },
        403
      );
    }

    // Deactivate an account.
    if (action === "deactivate") {
      if (student.account_status === "deactivated") {
        return jsonResponse(
          { error: "This student account is already deactivated." },
          400
        );
      }

      const { error } = await adminClient
        .from("profiles")
        .update({
          account_status: "deactivated",
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", studentId);

      if (error) throw error;

      return jsonResponse({
        success: true,
        message: `${student.full_name}'s account was successfully deactivated.`
      });
    }

    // Reactivate an account. No 10-day restriction.
    if (action === "reactivate") {
      if (student.account_status === "active") {
        return jsonResponse(
          { error: "This student account is already active." },
          400
        );
      }

      const { error } = await adminClient
        .from("profiles")
        .update({
          account_status: "active",
          deactivated_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", studentId);

      if (error) throw error;

      return jsonResponse({
        success: true,
        message: `${student.full_name}'s account was successfully reactivated.`
      });
    }

    // DELETE: allow immediate deletion only when there is no enrollment history.
    if (action === "delete") {
      // Protect students who have enrollment records.
      const { count: enrollmentCount, error: enrollmentError } =
        await adminClient
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentId);

      if (enrollmentError) throw enrollmentError;

      if ((enrollmentCount || 0) > 0) {
        return jsonResponse(
          {
            error:
              "This student has enrollment history and cannot be permanently deleted. Deactivate the account instead."
          },
          409
        );
      }

      // Protect student messages because their foreign key uses RESTRICT.
      const { count: messageCount, error: messageError } =
        await adminClient
          .from("student_messages")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentId);

      if (messageError) throw messageError;

      if ((messageCount || 0) > 0) {
        return jsonResponse(
          {
            error:
              "This student has submitted messages and cannot be permanently deleted because those records must be preserved. Deactivate the account instead."
          },
          409
        );
      }

      // Delete the Auth user. The related profile is expected to cascade
      // through profiles.id -> auth.users.id.
      const { error: deleteError } =
        await adminClient.auth.admin.deleteUser(studentId);

      if (deleteError) {
        console.error("Student deletion failed:", deleteError.message);

        return jsonResponse(
          {
            error:
              "Unable to delete this student. Related records may still reference this account. Deactivate the account instead."
          },
          409
        );
      }

      return jsonResponse({
        success: true,
        message: `${student.full_name}'s account was permanently deleted.`
      });
    }

    return jsonResponse({ error: "Unsupported action." }, 400);

  } catch (error) {
    console.error("Manage student error:", error);

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
