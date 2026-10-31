
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200
) => {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(
        { error: "Supabase environment configuration is missing." },
        500
      );
    }

    // Verify caller's access token.
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized request." }, 401);
    }

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

    // Privileged client: never expose this key to the frontend.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Verify that the caller is an active Super Admin.
    const { data: callerProfile, error: callerError } =
      await adminClient
        .from("profiles")
        .select("id, role, account_status")
        .eq("id", caller.id)
        .single();

    if (
      callerError ||
      !callerProfile ||
      callerProfile.role !== "super_admin" ||
      callerProfile.account_status !== "active"
    ) {
      return jsonResponse(
        { error: "Only an active Super Admin can manage administrators." },
        403
      );
    }

    const body = await req.json();

    const action = String(body.action || "").trim();
    const adminId = String(body.adminId || "").trim();

    if (!action || !adminId) {
      return jsonResponse(
        { error: "Action and administrator ID are required." },
        400
      );
    }

    // Protect the currently logged-in Super Admin.
    if (adminId === caller.id) {
      return jsonResponse(
        { error: "You cannot manage your own account through this action." },
        403
      );
    }

    // Find the target account.
    const { data: target, error: targetError } =
      await adminClient
        .from("profiles")
        .select("id, full_name, email, role, account_status")
        .eq("id", adminId)
        .single();

    if (targetError || !target) {
      return jsonResponse(
        { error: "Administrator account was not found." },
        404
      );
    }

    // Never modify another Super Admin.
    if (target.role !== "admin") {
      return jsonResponse(
        { error: "Only regular Admin accounts can be managed." },
        403
      );
    }

    // Perform the requested operation.
    switch (action) {

      // DEACTIVATE
      case "deactivate": {
        if (target.account_status === "deactivated") {
          return jsonResponse(
            { error: "This administrator is already deactivated." },
            400
          );
        }

        const { error } = await adminClient
          .from("profiles")
          .update({
            account_status: "deactivated",
            deactivated_at: new Date().toISOString()
          })
          .eq("id", adminId)
          .eq("role", "admin");

        if (error) throw error;

        return jsonResponse({
          success: true,
          message: `${target.full_name}'s account has been deactivated.`
        });
      }

      // REACTIVATE
      case "reactivate": {
        if (target.account_status === "active") {
          return jsonResponse(
            { error: "This administrator is already active." },
            400
          );
        }

        const { error } = await adminClient
          .from("profiles")
          .update({
            account_status: "active",
            deactivated_at: null
          })
          .eq("id", adminId)
          .eq("role", "admin");

        if (error) throw error;

        return jsonResponse({
          success: true,
          message: `${target.full_name}'s account has been reactivated.`
        });
      }

      // CHANGE PASSWORD
      case "change_password": {
        const password = String(body.newPassword || "");
        const confirmPassword = String(body.confirmPassword || "");

        if (!password || !confirmPassword) {
          return jsonResponse(
            { error: "New password and confirmation are required." },
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
            { error: "Passwords do not match." },
            400
          );
        }

        const { error } = await adminClient.auth.admin.updateUserById(
          adminId,
          { password }
        );

        if (error) throw error;

        return jsonResponse({
          success: true,
          message: `Password updated successfully for ${target.full_name}.`
        });
      }

      // DELETE
      case "delete": {
        const confirmation = String(body.confirmation || "");

        if (confirmation !== "DELETE") {
          return jsonResponse(
            { error: "Deletion confirmation is required." },
            400
          );
        }

        const { error } = await adminClient.auth.admin.deleteUser(adminId);

        if (error) {
          console.error("Admin deletion failed:", error.message);

          return jsonResponse(
            {
              error:
                "This administrator could not be deleted. Their account may be linked to existing Academy records. Deactivate the account instead."
            },
            409
          );
        }

        return jsonResponse({
          success: true,
          message: `${target.full_name}'s account has been permanently deleted.`
        });
      }

      default:
        return jsonResponse(
          {
            error:
              "Invalid action. Supported actions: deactivate, reactivate, change_password, delete."
          },
          400
        );
    }

  } catch (error) {
    console.error("Manage admin error:", error);

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
