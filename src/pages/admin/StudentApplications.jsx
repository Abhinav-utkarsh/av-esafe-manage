import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
  X,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./StudentApplications.css";

const APPLICATION_STATUSES = [
  "new",
  "approved",
  "rejected",
];

const prettyStatus = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("all");

  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchApplications = useCallback(
    async (quiet = false) => {
      quiet ? setRefreshing(true) : setLoading(true);

      setError("");

      try {
        const { data, error: queryError } = await supabase
          .from("student_applications")
          .select("*")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;

        setApplications(data || []);

        setSelected((current) =>
          current
            ? (data || []).find((row) => row.id === current.id) || null
            : null
        );
      } catch (err) {
        console.error("Student applications loading error:", err);

        setError(
          err.message ||
            "Unable to load student applications. Check the Admin RLS policy."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return applications.filter((row) => {
      const matchSearch =
        !q ||
        [
          row.full_name,
          row.email,
          row.phone,
          row.transaction_reference,
          row.interested_track,
          row.selected_bundle,
          row.college,
        ].some((value) =>
          String(value || "").toLowerCase().includes(q)
        );

      return (
        matchSearch &&
        (applicationFilter === "all" ||
          row.application_status === applicationFilter)
      );
    });
  }, [
    applications,
    search,
    applicationFilter,
  ]);

  const counts = useMemo(
    () => ({
      total: applications.length,

      approved: applications.filter(
        (row) => row.application_status === "approved"
      ).length,
    }),
    [applications]
  );

  const updateApplication = async (row, changes, message) => {
    if (!row?.id) return;

    setBusyId(row.id);
    setError("");
    setSuccess("");

    try {
      const { data, error: updateError } = await supabase
        .from("student_applications")
        .update({
          ...changes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      setApplications((previous) =>
        previous.map((item) =>
          item.id === row.id ? data : item
        )
      );

      setSelected((previous) =>
        previous?.id === row.id ? data : previous
      );

      setSuccess(message);

      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      console.error("Student application update error:", err);

      setError(
        err.message ||
          "Unable to update application. Verify the Admin UPDATE RLS policy."
      );
    } finally {
      setBusyId(null);
    }
  };

  const approveApplication = async (row) => {
    if (row.application_status === "rejected") {
      setError("Rejected applications cannot be approved.");
      return;
    }

    setBusyId(row.id);
    setError("");
    setSuccess("");

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "create-student-from-application",
        {
          body: { application_id: row.id },
        }
      );

      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);

      await fetchApplications(true);
      setSelected(null);

      if (data?.temporary_password) {
        setSuccess(
          `Application approved. Student account created. Temporary password: ${data.temporary_password}. Share it securely with the student.`
        );
      } else {
        setSuccess(
          "Application approved. Student account already exists."
        );
      }
    } catch (err) {
      console.error("Student account creation error:", err);
      setError(
        err.message ||
          "Unable to create student account. Please check the Edge Function deployment."
      );
    } finally {
      setBusyId(null);
    }
  };

  const rejectApplication = (row, reason) =>
    updateApplication(
      row,
      {
        application_status: "rejected",

        ...(reason.trim()
          ? {
              goals: `${row.goals || ""}${
                row.goals ? "\n\n" : ""
              }Admin rejection reason: ${reason.trim()}`,
            }
          : {}),
      },
      "Application rejected."
    );

  const deleteApplication = async (row) => {
    if (!row?.id || row.application_status !== "rejected") return;

    const confirmed = window.confirm(
      `Permanently delete the rejected application of ${row.full_name || "this applicant"}?\\n\\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setBusyId(row.id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("student_applications")
        .delete()
        .eq("id", row.id);

      if (deleteError) throw deleteError;

      setApplications((previous) =>
        previous.filter((item) => item.id !== row.id)
      );

      setSelected((previous) =>
        previous?.id === row.id ? null : previous
      );

      setSuccess("Rejected application permanently deleted from the database.");
    } catch (err) {
      console.error("Student application deletion error:", err);
      setError(
        err.message ||
          "Unable to delete application. Verify the Admin DELETE RLS policy."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="student-applications-page">
      <header className="sa-header">
        <div>
          <span className="sa-eyebrow">
            ACADEMY MANAGEMENT
          </span>

          <h1>Student Applications</h1>

          <p>
            Review website applications and approve or reject applicants.
          </p>
        </div>

        <button
          className="sa-refresh"
          onClick={() => fetchApplications(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "sa-spin" : ""}
          />

          Refresh
        </button>
      </header>

      {error && (
        <div className="sa-alert sa-alert-error">
          <AlertTriangle size={17} />

          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="sa-alert sa-alert-success">
          <CheckCircle2 size={17} />

          <span>{success}</span>

          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="sa-summary-grid">
        <Summary
          icon={<ClipboardList size={21} />}
          label="Total Applications"
          value={loading ? "…" : counts.total}
          tone="blue"
        />

        <Summary
          icon={<Users size={21} />}
          label="Approved"
          value={loading ? "…" : counts.approved}
          tone="purple"
        />
      </div>

      <section className="sa-table-card">
        <div className="sa-table-heading">
          <div>
            <h2>Applications</h2>

            <p>
              Review submitted details and manage application status.
            </p>
          </div>

          <div className="sa-filters">
            <div className="sa-search">
              <Search size={16} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search applicant, email, transaction…"
              />
            </div>

            <select
              value={applicationFilter}
              onChange={(e) =>
                setApplicationFilter(e.target.value)
              }
            >
              <option value="all">
                All application statuses
              </option>

              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {prettyStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead>
              <tr>
                <th>APPLICANT</th>
                <th>TRACK / PACKAGE</th>
                <th>AMOUNT</th>
                <th>TRANSACTION REF.</th>
                <th>PAYMENT</th>
                <th>APPLICATION</th>
                <th>SUBMITTED</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="sa-empty">
                    Loading applications…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="sa-person">
                        <span className="sa-avatar">
                          {row.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "A"}
                        </span>

                        <div>
                          <strong>
                            {row.full_name || "—"}
                          </strong>

                          <small>
                            {row.email || "—"}
                          </small>

                          <small>
                            {row.phone || "—"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {row.interested_track || "—"}
                      </strong>

                      <small className="sa-subline">
                        {row.selected_bundle ||
                          row.bundle_coding_track ||
                          "Individual track"}
                      </small>
                    </td>

                    <td>
                      <strong className="sa-amount">
                        ₹{money(row.total_price)}
                      </strong>
                    </td>

                    <td>
                      <span className="sa-reference">
                        {row.transaction_reference || "—"}
                      </span>
                    </td>

                    <td>
                      <Status value={row.payment_status} />
                    </td>

                    <td>
                      <Status
                        value={row.application_status}
                      />
                    </td>

                    <td>{dateTime(row.created_at)}</td>

                    <td>
                      <button
                        className="sa-view-button"
                        onClick={() => setSelected(row)}
                      >
                        <Eye size={15} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="sa-empty">
                    <ClipboardList size={34} />

                    <strong>
                      {search ||
                      applicationFilter !== "all"
                        ? "No matching applications"
                        : "No applications yet"}
                    </strong>

                    <span>
                      Applications submitted from your public
                      website will appear here.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="sa-table-footer">
          Showing {loading ? "…" : filtered.length} of{" "}
          {applications.length} applications
        </footer>
      </section>

      {selected && (
        <div
          className="sa-modal-backdrop"
          onMouseDown={(e) =>
            e.target === e.currentTarget &&
            setSelected(null)
          }
        >
          <section className="sa-modal">
            <div className="sa-modal-header">
              <div>
                <span>APPLICATION REVIEW</span>

                <h2>{selected.full_name}</h2>

                <p>
                  {selected.email} · {selected.phone}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <div className="sa-detail-grid">
              <Detail
                label="Interested track"
                value={selected.interested_track}
              />

              <Detail
                label="Selected bundle"
                value={selected.selected_bundle || "Individual"}
              />

              <Detail
                label="Technical track option"
                value={selected.bundle_coding_track}
              />

              <Detail
                label="Application amount"
                value={`₹${money(selected.total_price)}`}
              />

              <Detail
                label="College / University"
                value={selected.college}
              />

              <Detail
                label="Current city"
                value={selected.current_city}
              />

              <Detail
                label="Current status"
                value={selected.current_status}
              />

              <Detail
                label="Submitted"
                value={dateTime(selected.created_at)}
              />

              <Detail
                label="Payment method"
                value={selected.payment_method || "UPI QR"}
              />

              <Detail
                label="Transaction reference"
                value={selected.transaction_reference}
              />
            </div>

            {selected.goals && (
              <div className="sa-detail-block">
                <label>Applicant goals / notes</label>

                <p>{selected.goals}</p>
              </div>
            )}

            <div className="sa-modal-status">
              <div>
                <label>Payment status</label>

                <Status value={selected.payment_status} />
              </div>

              <div>
                <label>Application status</label>

                <Status
                  value={selected.application_status}
                />
              </div>
            </div>

            <div className="sa-review-note">
              <AlertTriangle size={17} />

              <span>
                Payment verification is a manual check. Confirm
                the transaction reference in your UPI account
                before marking it verified. Approval does not
                automatically create a student login or
                enrollment.
              </span>
            </div>

            {rejectTarget && (
              <div className="sa-reject-box">
                <label>
                  Reason for rejection (optional)
                </label>

                <textarea
                  rows="2"
                  value={rejectReason}
                  onChange={(e) =>
                    setRejectReason(e.target.value)
                  }
                  placeholder="Add an internal reason…"
                />

                <div>
                  <button
                    onClick={() => {
                      setRejectTarget(null);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="sa-reject-confirm"
                    disabled={busyId === selected.id}
                    onClick={() =>
                      rejectApplication(
                        selected,
                        rejectReason
                      )
                    }
                  >
                    {busyId === selected.id
                      ? "Saving…"
                      : "Confirm rejection"}
                  </button>
                </div>
              </div>
            )}

            <div className="sa-modal-actions">
              {selected.application_status === "new" && (
                  <button
                    className="sa-primary-action"
                    disabled={busyId === selected.id}
                    onClick={() =>
                      approveApplication(selected)
                    }
                  >
                    <CheckCircle2 size={16} />
                    Approve Application
                  </button>
                )}

              {selected.payment_status !== "rejected" &&
                selected.application_status !== "rejected" && (
                  <button
                    className="sa-danger-action"
                    disabled={
                      busyId === selected.id ||
                      Boolean(rejectTarget)
                    }
                    onClick={() =>
                      setRejectTarget(selected)
                    }
                  >
                    <XCircle size={16} />
                    Reject Application
                  </button>
                )}

              {selected.application_status === "rejected" && (
                <button
                  className="sa-danger-action"
                  disabled={busyId === selected.id}
                  onClick={() => deleteApplication(selected)}
                >
                  <Trash2 size={16} />
                  {busyId === selected.id
                    ? "Deleting…"
                    : "Delete Rejected Application"}
                </button>
              )}

              <button
                className="sa-secondary-action"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Summary({ icon, label, value, tone }) {
  return (
    <div className="sa-summary-card">
      <div className={`sa-summary-icon ${tone}`}>
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Status({ value }) {
  const v = value || "new";

  return (
    <span className={`sa-status sa-status-${v}`}>
      {prettyStatus(v)}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div className="sa-detail">
      <label>{label}</label>
      <strong>{value || "—"}</strong>
    </div>
  );
}