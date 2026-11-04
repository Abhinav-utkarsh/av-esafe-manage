import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Users,
  Search,
  RefreshCw,
  UserPlus,
  Pencil,
  Mail,
  Phone,
  GraduationCap,
  X,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";

import "./Students.css";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedAction, setSelectedAction] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, created_at, account_status, deactivated_at"
        )
        .eq("role", "student")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setStudents(data || []);
    } catch (err) {
      console.error("Student loading error:", err);
      setError(
        err.message || "Unable to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setFormError("");
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: ""
    });

    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormError("");
  };

  const closeAddModal = () => {
    if (creatingStudent) return;

    setShowAddModal(false);
    setEditingStudent(null);
    resetForm();
  };

  const openEditModal = (student) => {
    setSuccessMessage("");
    setFormError("");
    setEditingStudent(student);

    setFormData({
      full_name: student.full_name || "",
      email: student.email || "",
      phone: student.phone || "",
      password: "",
      confirm_password: ""
    });

    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAddModal(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const fullName = formData.full_name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;
    const confirmPassword = formData.confirm_password;

    if (!fullName || !email) {
      setFormError("Please complete the name and email address.");
      return;
    }

    if (!editingStudent && (!password || !confirmPassword)) {
      setFormError("Please complete both password fields.");
      return;
    }

    if (editingStudent && password && !confirmPassword) {
      setFormError("Please confirm the new password.");
      return;
    }

    if (editingStudent && !password && confirmPassword) {
      setFormError("Enter the new password first.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (password && password.length < 8) {
      setFormError("Password must contain at least 8 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      setFormError("Password and Confirm Password do not match.");
      return;
    }

    setCreatingStudent(true);

    try {
      if (editingStudent) {
        const { data, error } = await supabase.functions.invoke(
          "update-student-account",
          {
            body: {
              studentId: editingStudent.id,
              fullName,
              email,
              phone,
              password: password || null
            }
          }
        );

        if (error) {
          let message =
            error.message || "Unable to update student account.";

          try {
            const response = error.context;

            if (response && typeof response.json === "function") {
              const responseBody = await response.json();

              if (responseBody?.error) {
                message = responseBody.error;
              }
            }
          } catch {
            // Retain the original error message.
          }

          throw new Error(message);
        }

        if (!data?.success) {
          throw new Error(
            data?.error || "Student account could not be updated."
          );
        }

        setSuccessMessage(
          `Student account updated successfully for ${email}${password ? ". Password changed." : "."
          }`
        );

        setShowAddModal(false);
        setEditingStudent(null);
        resetForm();

        await fetchStudents();
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-student",
        {
          body: {
            fullName,
            email,
            phone,
            password,
            confirmPassword
          }
        }
      );

      if (error) {
        let message =
          error.message || "Unable to create student account.";

        try {
          const response = error.context;

          if (response && typeof response.json === "function") {
            const responseBody = await response.json();

            if (responseBody?.error) {
              message = responseBody.error;
            }
          }
        } catch {
          // Keep the original error message.
        }

        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "Student account could not be created."
        );
      }

      setSuccessMessage(
        `Student account created successfully for ${email}. No invitation email was sent. Share the login credentials with the student securely.`
      );

      setShowAddModal(false);
      setEditingStudent(null);
      resetForm();

      await fetchStudents();
    } catch (err) {
      console.error("Student creation error:", err);

      setFormError(
        err.message ||
        "Unable to create student account. Please try again."
      );
    } finally {
      setCreatingStudent(false);
    }
  };

  // Calculate the remaining reactivation/deletion waiting period.
  const getAccountTiming = (student) => {
    if (
      student.account_status !== "deactivated" ||
      !student.deactivated_at
    ) {
      return {
        remainingMs: 0,
        remainingDays: 0,
        canReactivate: false,
        canDelete: false
      };
    }

    const deactivatedTime = new Date(
      student.deactivated_at
    ).getTime();

    if (Number.isNaN(deactivatedTime)) {
      return {
        remainingMs: TEN_DAYS_MS,
        remainingDays: 10,
        canReactivate: false,
        canDelete: false
      };
    }

    const elapsed = Date.now() - deactivatedTime;
    const remainingMs = Math.max(0, TEN_DAYS_MS - elapsed);

    return {
      remainingMs,
      remainingDays: Math.ceil(
        remainingMs / (24 * 60 * 60 * 1000)
      ),
      canReactivate: elapsed < TEN_DAYS_MS,
      canDelete: elapsed >= TEN_DAYS_MS
    };
  };

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    return students.filter((student) => {
      return (
        student.full_name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.phone?.toLowerCase().includes(query)
      );
    });
  }, [students, search]);

  const activeStudents = students.filter(
    (student) => student.account_status !== "deactivated"
  ).length;

  const deactivatedStudents = students.length - activeStudents;

  const openActionModal = (student, action) => {
    setActionError("");
    setSelectedAction({ student, action });
  };
  const closeActionModal = () => {
    if (processingAction) return;

    setSelectedAction(null);
    setActionError("");
  };

  // Call the secure Supabase Edge Function.
  const handleStudentAction = async () => {
    if (!selectedAction || processingAction) return;

    const { student, action } = selectedAction;

    setProcessingAction(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "manage-student",
        {
          body: {
            studentId: student.id,
            action: action
          }
        }
      );

      if (error) {
        let message =
          error.message || "Unable to complete the operation.";

        try {
          const response = error.context;

          if (response && typeof response.json === "function") {
            const responseBody = await response.json();

            if (responseBody?.error) {
              message = responseBody.error;
            }
          }
        } catch {
          // Keep the original error message.
        }

        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "The operation could not be completed."
        );
      }

      const messages = {
        deactivate: `${student.full_name} has been deactivated. The account can be reactivated within 10 days.`,
        reactivate: `${student.full_name}'s account has been reactivated.`,
        delete: `${student.full_name}'s account has been permanently deleted.`
      };

      setSelectedAction(null);
      setSuccessMessage(messages[action]);

      await fetchStudents();
    } catch (err) {
      console.error("Student management error:", err);

      setActionError(
        err.message || "Unable to complete the operation."
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const getActionDetails = () => {
    if (!selectedAction) return null;

    const { student, action } = selectedAction;

    const details = {
      deactivate: {
        title: "Deactivate Student?",
        description:
          "This student will immediately lose access to Av_eSAFE Academy. You can reactivate the account within the next 10 days.",
        button: "Deactivate Account",
        icon: ShieldBan,
        className: "danger"
      },
      reactivate: {
        title: "Reactivate Student?",
        description:
          "The student will regain access to Av_eSAFE Academy and can log in again.",
        button: "Reactivate Account",
        icon: ShieldCheck,
        className: "success"
      },
      delete: {
        title: "Permanently Delete Student?",
        description:
          "This permanently removes the student's authentication account and profile. This action cannot be undone. Students with enrollment history are protected by the backend.",
        button: "Delete Permanently",
        icon: Trash2,
        className: "danger"
      }
    };

    return {
      student,
      action,
      ...details[action]
    };
  };

  const actionDetails = getActionDetails();

  return (
    <div className="students-page">

      {/* PAGE HEADER */}
      <div className="students-header">
        <div>
          <span className="students-eyebrow">MANAGEMENT</span>
          <h1>Students</h1>
          <p>
            View and manage students enrolled in Av_eSAFE Academy.
          </p>
        </div>

        <button
          className="add-student-button"
          onClick={() => {
            setSuccessMessage("");
            setFormError("");
            setEditingStudent(null);
            resetForm();
            setShowAddModal(true);
          }}
        >
          <UserPlus size={18} />
          Add Student
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="students-success">
          <CheckCircle2 size={19} />
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="students-account-summary">

        <div className="students-summary">
          <div className="students-summary-icon">
            <Users size={23} />
          </div>
          <div>
            <span>Total Students</span>
            <h2>{loading ? "..." : students.length}</h2>
          </div>
        </div>

        <div className="students-summary">
          <div className="students-summary-icon active">
            <ShieldCheck size={23} />
          </div>
          <div>
            <span>Active Accounts</span>
            <h2>{loading ? "..." : activeStudents}</h2>
          </div>
        </div>

        <div className="students-summary">
          <div className="students-summary-icon inactive">
            <ShieldBan size={23} />
          </div>
          <div>
            <span>Deactivated Accounts</span>
            <h2>{loading ? "..." : deactivatedStudents}</h2>
          </div>
        </div>

      </div>

      {/* STUDENT TABLE */}
      <div className="students-table-container">

        <div className="students-table-header">
          <div>
            <h3>All Students</h3>
            <p>Student accounts registered in the Academy</p>
          </div>

          <div className="students-table-actions">
            <div className="students-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="students-refresh"
              onClick={fetchStudents}
              disabled={loading}
              title="Refresh students"
            >
              <RefreshCw
                size={17}
                className={loading ? "refresh-spinning" : ""}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="students-error">
            {error}
            <button onClick={fetchStudents}>Retry</button>
          </div>
        )}

        <div className="students-table-scroll">
          <table className="students-table">

            <thead>
              <tr>
                <th>STUDENT</th>
                <th>EMAIL ADDRESS</th>
                <th>PHONE</th>
                <th>JOINED DATE</th>
                <th>STATUS</th>
                <th>ACCOUNT ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="students-empty">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isDeactivated =
                    student.account_status === "deactivated";

                  const timing = getAccountTiming(student);

                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="student-name-cell">
                          <div className="student-avatar">
                            {student.full_name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <strong>
                            {student.full_name || "Unnamed Student"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span className="student-email">
                          <Mail size={14} />
                          {student.email}
                        </span>
                      </td>

                      <td>
                        <span className="student-phone">
                          <Phone size={14} />
                          {student.phone || "Not provided"}
                        </span>
                      </td>

                      <td>
                        {student.created_at
                          ? new Date(
                            student.created_at
                          ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td>
                        {isDeactivated ? (
                          <div className="student-status-wrapper">
                            <span className="student-status deactivated">
                              Deactivated
                            </span>

                            {timing.remainingMs > 0 ? (
                              <small>
                                {timing.remainingDays} day(s) left
                              </small>
                            ) : (
                              <small>10-day period completed</small>
                            )}
                          </div>
                        ) : (
                          <span className="student-status">
                            Active
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="student-account-actions">

                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            className="student-action-button edit"
                            onClick={() => openEditModal(student)}
                            title="Edit student details or password"
                          >
                            <Pencil size={15} />
                          </button>

                          {/* DEACTIVATE / REACTIVATE BUTTON */}
                          {!isDeactivated ? (
                            <button
                              type="button"
                              className="student-action-button deactivate"
                              onClick={() => openActionModal(student, "deactivate")}
                              title="Deactivate student"
                            >
                              <ShieldBan size={15} />
                            </button>
                          ) : (
                            timing.canReactivate && (
                              <button
                                type="button"
                                className="student-action-button reactivate"
                                onClick={() => openActionModal(student, "reactivate")}
                                title="Reactivate student"
                              >
                                <ShieldCheck size={15} />
                              </button>
                            )
                          )}

                          {/* DELETE BUTTON */}
                          <button
                            type="button"
                            className="student-action-button delete"
                            onClick={() => openActionModal(student, "delete")}
                            title="Permanently delete student"
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="students-empty">
                    <div>
                      <GraduationCap size={35} />

                      <h3>
                        {search
                          ? "No matching students found"
                          : "No students yet"}
                      </h3>

                      <p>
                        {search
                          ? "Try searching with a different name, email or phone."
                          : "Create a student account using the Add Student button."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        <div className="students-table-footer">
          Showing {loading ? "..." : filteredStudents.length} of{" "}
          {students.length} students
        </div>

      </div>
      {/* ADD / EDIT STUDENT MODAL */}
      {showAddModal && (
        <div
          className="student-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
          >
            <div className="student-modal-header">
              <div className="student-modal-heading">
                <div className="student-modal-icon">
                  <UserPlus size={22} />
                </div>

                <div>
                  <h2 id="add-student-title">
                    {editingStudent
                      ? "Edit Student"
                      : "Add New Student"}
                  </h2>

                  <p>
                    {editingStudent
                      ? "Update student details or set a new login password. Leave password blank to keep the current one."
                      : "Create a student account with login credentials."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={closeAddModal}
                disabled={creatingStudent}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="student-modal-form"
              onSubmit={handleCreateStudent}
            >
              <div className="student-form-field">
                <label htmlFor="student-full-name">
                  Full Name <span>*</span>
                </label>

                <div className="student-form-input">
                  <User size={17} />

                  <input
                    id="student-full-name"
                    type="text"
                    name="full_name"
                    placeholder="Enter student's full name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="student-form-field">
                <label htmlFor="student-email">
                  Email Address <span>*</span>
                </label>

                <div className="student-form-input">
                  <Mail size={17} />

                  <input
                    id="student-email"
                    type="email"
                    name="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    maxLength={254}
                    required
                    readOnly={Boolean(editingStudent)}
                    title={
                      editingStudent
                        ? "Email address cannot be changed"
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="student-form-field">
                <label htmlFor="student-phone">
                  Phone Number
                </label>

                <div className="student-form-input">
                  <Phone size={17} />

                  <input
                    id="student-phone"
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="student-form-field">
                <label htmlFor="student-password">
                  Password{" "}
                  {editingStudent ? "(optional)" : <span>*</span>}
                </label>

                <div className="student-form-input student-password-input">
                  <KeyRound size={17} />

                  <input
                    id="student-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={
                      editingStudent
                        ? "Enter new password (leave blank to keep current)"
                        : "Create a password (minimum 8 characters)"
                    }
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength={8}
                    autoComplete="new-password"
                    required={!editingStudent}
                  />

                  <button
                    type="button"
                    className="student-password-toggle"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="student-form-field">
                <label htmlFor="student-confirm-password">
                  Confirm Password{" "}
                  {editingStudent
                    ? "(if changing password)"
                    : <span>*</span>}
                </label>

                <div className="student-form-input student-password-input">
                  <KeyRound size={17} />

                  <input
                    id="student-confirm-password"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    name="confirm_password"
                    placeholder={
                      editingStudent
                        ? "Confirm new password"
                        : "Re-enter the password"
                    }
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    minLength={8}
                    autoComplete="new-password"
                    required={!editingStudent}
                  />

                  <button
                    type="button"
                    className="student-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="student-invitation-note">
                <ShieldCheck size={18} />

                <p>
                  {editingStudent
                    ? "Student account details are updated securely. A new password is applied only when you enter one."
                    : "The account will be created immediately without sending an invitation email. Share the student's email and password securely."}
                </p>
              </div>

              {formError && (
                <div className="student-form-error">
                  <AlertCircle size={17} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="student-modal-actions">
                <button
                  type="button"
                  className="student-cancel-button"
                  onClick={closeAddModal}
                  disabled={creatingStudent}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-create-button"
                  disabled={creatingStudent}
                >
                  {creatingStudent ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="refresh-spinning"
                      />

                      {editingStudent
                        ? "Updating..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Send size={17} />

                      {editingStudent
                        ? "Update Student"
                        : "Create Student"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT ACTION CONFIRMATION MODAL */}
      {actionDetails && (
        <div
          className="student-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeActionModal();
            }
          }}
        >
          <div
            className="student-action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-action-title"
          >
            <div className="student-action-modal-header">
              <div
                className={`student-action-modal-icon ${actionDetails.className}`}
              >
                <actionDetails.icon size={24} />
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={closeActionModal}
                disabled={processingAction}
                aria-label="Close confirmation"
              >
                <X size={20} />
              </button>
            </div>

            <div className="student-action-modal-content">
              <h2 id="student-action-title">
                {actionDetails.title}
              </h2>

              <p>{actionDetails.description}</p>

              <div className="student-action-target">
                <div className="student-avatar">
                  {actionDetails.student.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "S"}
                </div>

                <div>
                  <strong>
                    {actionDetails.student.full_name}
                  </strong>

                  <span>
                    {actionDetails.student.email}
                  </span>
                </div>
              </div>

              {actionDetails.action === "delete" && (
                <div className="student-delete-warning">
                  <AlertTriangle size={17} />

                  <span>
                    This action is permanent. Deletion will also be
                    blocked if the student has enrollment history.
                  </span>
                </div>
              )}

              {actionError && (
                <div className="student-form-error">
                  <AlertCircle size={17} />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            <div className="student-action-modal-footer">
              <button
                type="button"
                className="student-cancel-button"
                onClick={closeActionModal}
                disabled={processingAction}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`student-confirm-action ${actionDetails.className}`}
                onClick={handleStudentAction}
                disabled={processingAction}
              >
                {processingAction ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="refresh-spinning"
                    />

                    Processing...
                  </>
                ) : (
                  <>
                    {actionDetails.action === "deactivate" && (
                      <ShieldBan size={16} />
                    )}

                    {actionDetails.action === "reactivate" && (
                      <ShieldCheck size={16} />
                    )}

                    {actionDetails.action === "delete" && (
                      <Trash2 size={16} />
                    )}

                    {actionDetails.button}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}