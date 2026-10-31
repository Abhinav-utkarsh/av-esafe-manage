
import { useCallback, useEffect, useState } from "react";

import {
  ShieldCheck,
  Shield,
  UserPlus,
  RefreshCw,
  Search,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Trash2,
  Power,
  LoaderCircle,
  AlertCircle,
  X,
  LockKeyhole,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

import "./AdminManagement.css";

export default function AdminManagement() {
  const { profile, isSuperAdmin } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add Admin modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Change Password modal
  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [changePasswordData, setChangePasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] =
    useState(false);

  // Load administrator accounts.
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, account_status, created_at, deactivated_at"
        )
        .in("role", ["admin", "super_admin"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAdmins(data || []);
    } catch (err) {
      console.error("Admin loading failed:", err);
      setError(err.message || "Unable to load administrators.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  // Search administrators.
  const filteredAdmins = admins.filter((admin) => {
    const searchValue = search.toLowerCase();

    return (
      admin.full_name?.toLowerCase().includes(searchValue) ||
      admin.email?.toLowerCase().includes(searchValue) ||
      admin.role?.toLowerCase().includes(searchValue)
    );
  });

  const activeAdmins = admins.filter(
    (admin) => admin.account_status === "active"
  ).length;

  const superAdmins = admins.filter(
    (admin) => admin.role === "super_admin"
  ).length;

  // Invoke Edge Functions and extract actual response errors.
  const invokeAdminFunction = async (functionName, payload) => {
    const { data, error } = await supabase.functions.invoke(
      functionName,
      {
        body: payload
      }
    );

    if (error) {
      console.error("Edge Function error:", error);

      let responseDetails = "";

      if (error.context) {
        try {
          const response = error.context.clone
            ? error.context.clone()
            : error.context;

          const contentType =
            response.headers?.get("content-type") || "";

          if (contentType.includes("application/json")) {
            const responseData = await response.json();

            responseDetails =
              responseData?.error ||
              responseData?.message ||
              JSON.stringify(responseData);
          } else {
            responseDetails = await response.text();
          }
        } catch (parseError) {
          console.error(
            "Could not read Edge Function response:",
            parseError
          );
        }
      }

      throw new Error(
        responseDetails ||
        error.message ||
        "Administrator operation failed."
      );
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  };

  // Create Admin.
  const handleAddAdmin = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setActionLoading(true);

    try {
      await invokeAdminFunction("create-admin", {
        fullName,
        email,
        password,
        confirmPassword
      });

      setSuccess(
        `Administrator account for ${fullName} created successfully. They can now log in using their email and password.`
      );

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowAddModal(false);

      await loadAdmins();
    } catch (err) {
      console.error("Admin creation failed:", err);
      setError(err.message || "Unable to create administrator.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Change Password modal.
  const openChangePasswordModal = (admin) => {
    setError("");
    setSuccess("");

    setSelectedAdmin(admin);

    setChangePasswordData({
      newPassword: "",
      confirmPassword: ""
    });

    setShowNewPassword(false);
    setShowNewConfirmPassword(false);

    setShowChangePasswordModal(true);
  };

  // Change an administrator's password.
  const handleChangePassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedAdmin) {
      setError("Please select an administrator.");
      return;
    }

    const { newPassword, confirmPassword } = changePasswordData;

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setActionLoading(true);

    try {
      await invokeAdminFunction("manage-admin", {
        action: "change_password",
        adminId: selectedAdmin.id,
        newPassword,
        confirmPassword
      });

      setSuccess(
        `Password updated successfully for ${selectedAdmin.full_name}.`
      );

      setShowChangePasswordModal(false);
      setSelectedAdmin(null);

      setChangePasswordData({
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      console.error("Password update failed:", err);
      setError(err.message || "Unable to update password.");
    } finally {
      setActionLoading(false);
    }
  };

  // Deactivate, reactivate or delete an administrator.
  const handleAccountAction = async (admin, action) => {
    if (admin.role === "super_admin") {
      setError("Super Admin accounts cannot be managed.");
      return;
    }

    if (admin.id === profile?.id) {
      setError("You cannot manage your own account here.");
      return;
    }

    const actionLabels = {
      deactivate: "deactivate",
      reactivate: "reactivate",
      delete: "permanently delete"
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabels[action]} ${admin.full_name} (${admin.email})?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        action,
        adminId: admin.id
      };

      // Backend requires an explicit confirmation for deletion.
      if (action === "delete") {
        payload.confirmation = "DELETE";
      }

      await invokeAdminFunction("manage-admin", payload);

      setSuccess(
        `${admin.full_name}'s account was successfully ${
          action === "delete"
            ? "deleted"
            : action === "deactivate"
              ? "deactivated"
              : "reactivated"
        }.`
      );

      await loadAdmins();
    } catch (err) {
      console.error("Admin management failed:", err);
      setError(err.message || "Unable to complete the operation.");
    } finally {
      setActionLoading(false);
    }
  };

  // Close Add Admin modal.
  const closeAddModal = () => {
    if (actionLoading) return;

    setShowAddModal(false);
    setShowPassword(false);
    setShowConfirmPassword(false);

    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
  };

  // Close Change Password modal.
  const closeChangePasswordModal = () => {
    if (actionLoading) return;

    setShowChangePasswordModal(false);
    setSelectedAdmin(null);

    setChangePasswordData({
      newPassword: "",
      confirmPassword: ""
    });

    setShowNewPassword(false);
    setShowNewConfirmPassword(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="admin-management-denied">
        <ShieldCheck size={42} />
        <h2>Access Restricted</h2>
        <p>
          Only the Super Admin can access administrator management.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-management-page">

      {/* PAGE HEADER */}
      <div className="admin-management-header">
        <div>
          <div className="admin-management-eyebrow">
            <ShieldCheck size={15} />
            SUPER ADMIN CONTROL
          </div>

          <h1>Admin Management</h1>

          <p>
            Manage administrator accounts and control access
            to Av_eSAFE Academy.
          </p>
        </div>

        <div className="admin-management-header-actions">
          <button
            className="admin-refresh-btn"
            onClick={loadAdmins}
            disabled={loading || actionLoading}
          >
            <RefreshCw
              size={17}
              className={loading ? "admin-spinning" : ""}
            />
            Refresh
          </button>

          <button
            className="admin-add-btn"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowAddModal(true);
            }}
          >
            <UserPlus size={18} />
            Add Admin
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="admin-summary-grid">

        <div className="admin-summary-card">
          <div className="admin-summary-icon">
            <Shield size={21} />
          </div>

          <div>
            <h3>{admins.length}</h3>
            <p>Total Administrators</p>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon green">
            <CheckCircle size={21} />
          </div>

          <div>
            <h3>{activeAdmins}</h3>
            <p>Active Administrators</p>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon purple">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h3>{superAdmins}</h3>
            <p>Super Administrators</p>
          </div>
        </div>

      </div>

      {/* ADMIN TABLE */}
      <div className="admin-list-card">

        <div className="admin-list-header">
          <div>
            <h2>Administrator Accounts</h2>
            <p>View and manage all Academy administrators.</p>
          </div>

          <div className="admin-search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search administrators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">
            <LoaderCircle size={28} className="admin-spinning" />
            <p>Loading administrators...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="admin-empty">
            <User size={34} />
            <h3>No administrators found</h3>
            <p>Try another search or add a new administrator.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-management-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAdmins.map((admin) => {
                  const isSuper = admin.role === "super_admin";
                  const isActive = admin.account_status === "active";

                  return (
                    <tr key={admin.id}>
                      <td>
                        <div className="admin-person">
                          <div className="admin-avatar">
                            {admin.full_name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <strong>{admin.full_name}</strong>
                            <span>
                              <Mail size={13} />
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-role-badge ${
                            isSuper ? "super-admin" : "regular-admin"
                          }`}
                        >
                          {isSuper ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <Shield size={14} />
                          )}

                          {isSuper ? "Super Admin" : "Admin"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge ${
                            isActive ? "active" : "inactive"
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}

                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-date">
                          {admin.created_at
                            ? new Date(admin.created_at).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}
                        </span>
                      </td>

                      <td>
                        {isSuper ? (
                          <span className="admin-protected-label">
                            <ShieldCheck size={15} />
                            Protected
                          </span>
                        ) : (
                          <div className="admin-row-actions">

                            <button
                              className="admin-action-btn change-password"
                              title="Change Password"
                              disabled={actionLoading}
                              onClick={() =>
                                openChangePasswordModal(admin)
                              }
                            >
                              <KeyRound size={16} />
                            </button>

                            {isActive ? (
                              <button
                                className="admin-action-btn deactivate"
                                title="Deactivate"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleAccountAction(admin, "deactivate")
                                }
                              >
                                <Power size={16} />
                              </button>
                            ) : (
                              <button
                                className="admin-action-btn reactivate"
                                title="Reactivate"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleAccountAction(admin, "reactivate")
                                }
                              >
                                <RefreshCw size={16} />
                              </button>
                            )}

                            <button
                              className="admin-action-btn delete"
                              title="Delete"
                              disabled={actionLoading}
                              onClick={() =>
                                handleAccountAction(admin, "delete")
                              }
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ADD ADMIN MODAL */}
      {showAddModal && (
        <div
          className="admin-modal-overlay"
          onClick={closeAddModal}
        >
          <div
            className="admin-add-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h2>Add Administrator</h2>
                <p>
                  Create an administrator account with login credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={actionLoading}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAdmin}>

              <label htmlFor="admin-full-name">Full Name</label>

              <input
                id="admin-full-name"
                type="text"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fullName: e.target.value
                  })
                }
                maxLength={150}
                autoComplete="name"
                required
              />

              <label htmlFor="admin-email">Email Address</label>

              <input
                id="admin-email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value
                  })
                }
                autoComplete="email"
                required
              />

              <label htmlFor="admin-password">Password</label>

              <div className="admin-password-field">
                <LockKeyhole size={17} />

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password (minimum 8 characters)"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value
                    })
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <label htmlFor="admin-confirm-password">
                Confirm Password
              </label>

              <div className="admin-password-field">
                <LockKeyhole size={17} />

                <input
                  id="admin-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value
                    })
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <div className="admin-modal-note">
                <AlertCircle size={17} />
                The new account receives the regular Admin role.
                Passwords are securely managed by Supabase Auth.
                No invitation email will be sent.
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={closeAddModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-modal-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="admin-spinning"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create Admin
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && selectedAdmin && (
        <div
          className="admin-modal-overlay"
          onClick={closeChangePasswordModal}
        >
          <div
            className="admin-add-modal admin-change-password-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h2>Change Password</h2>
                <p>
                  Set a new password for {selectedAdmin.full_name}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeChangePasswordModal}
                disabled={actionLoading}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-selected-account">
              <div className="admin-avatar">
                {selectedAdmin.full_name?.charAt(0)?.toUpperCase()}
              </div>

              <div>
                <strong>{selectedAdmin.full_name}</strong>
                <span>{selectedAdmin.email}</span>
              </div>
            </div>

            <form onSubmit={handleChangePassword}>

              <label htmlFor="change-admin-password">
                New Password
              </label>

              <div className="admin-password-field">
                <LockKeyhole size={17} />

                <input
                  id="change-admin-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={changePasswordData.newPassword}
                  onChange={(e) =>
                    setChangePasswordData({
                      ...changePasswordData,
                      newPassword: e.target.value
                    })
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <label htmlFor="change-admin-confirm-password">
                Confirm New Password
              </label>

              <div className="admin-password-field">
                <LockKeyhole size={17} />

                <input
                  id="change-admin-confirm-password"
                  type={showNewConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={changePasswordData.confirmPassword}
                  onChange={(e) =>
                    setChangePasswordData({
                      ...changePasswordData,
                      confirmPassword: e.target.value
                    })
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewConfirmPassword(!showNewConfirmPassword)
                  }
                  aria-label={
                    showNewConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <div className="admin-modal-note">
                <ShieldCheck size={17} />
                The new password will take effect immediately.
                The administrator will not be forced to change it at login.
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={closeChangePasswordModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-modal-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="admin-spinning"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound size={17} />
                      Update Password
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
