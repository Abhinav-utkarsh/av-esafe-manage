
import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  RefreshCw,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  RotateCcw,
  Trash2
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./Payments.css";

const initialForm = {
  enrollment_id: "",
  amount: "",
  payment_method: "UPI",
  transaction_reference: "",
  payment_date: new Date().toISOString().slice(0, 10),
  notes: ""
};

const paymentMethods = ["UPI", "Cash", "Bank Transfer", "Other"];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [paymentResult, enrollmentResult, studentResult] =
        await Promise.all([
          supabase
            .from("payments")
            .select("*")
            .order("payment_date", { ascending: false })
            .order("created_at", { ascending: false }),

          supabase
            .from("enrollments")
            .select(
              "id, student_id, enrollment_date, total_fee, amount_paid, payment_status, enrollment_status"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "student")
        ]);

      if (paymentResult.error) throw paymentResult.error;
      if (enrollmentResult.error) throw enrollmentResult.error;
      if (studentResult.error) throw studentResult.error;

      setPayments(paymentResult.data || []);
      setEnrollments(enrollmentResult.data || []);
      setStudents(studentResult.data || []);
    } catch (err) {
      console.error("Payment loading error:", err);
      setError(err.message || "Unable to load payment information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getEnrollment = (id) =>
    enrollments.find((item) => item.id === id);

  const getStudent = (id) =>
    students.find((item) => item.id === id);

  const getStudentName = (enrollmentId) => {
    const enrollment = getEnrollment(enrollmentId);
    return getStudent(enrollment?.student_id)?.full_name || "Unknown student";
  };

  const getStudentEmail = (enrollmentId) => {
    const enrollment = getEnrollment(enrollmentId);
    return getStudent(enrollment?.student_id)?.email || "";
  };

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });

  // Handles both YYYY-MM-DD and timestamp values safely.
  const formatDate = (value) => {
    if (!value) return "—";

    const datePart = String(value).slice(0, 10);
    const date = new Date(`${datePart}T00:00:00`);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const filteredPayments = payments.filter((payment) => {
    const query = search.toLowerCase();

    const matchesSearch =
      getStudentName(payment.enrollment_id).toLowerCase().includes(query) ||
      getStudentEmail(payment.enrollment_id).toLowerCase().includes(query) ||
      payment.transaction_reference?.toLowerCase().includes(query) ||
      payment.payment_method?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || payment.payment_status === statusFilter;

    const matchesMethod =
      methodFilter === "all" || payment.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totals = {
    total: payments.length,
    pending: payments.filter((p) => p.payment_status === "pending").length,
    verified: payments.filter((p) => p.payment_status === "verified").length,
    rejected: payments.filter((p) => p.payment_status === "rejected").length
  };

  const verifiedAmount = payments
    .filter((p) => p.payment_status === "verified")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const openAddModal = () => {
    setForm({ ...initialForm });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm({ ...initialForm });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const selectedEnrollment = getEnrollment(form.enrollment_id);

  const verifiedForSelectedEnrollment = payments
    .filter(
      (p) =>
        p.enrollment_id === form.enrollment_id &&
        p.payment_status === "verified"
    )
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const outstandingForSelectedEnrollment = selectedEnrollment
    ? Math.max(
        0,
        Number(selectedEnrollment.total_fee || 0) -
          verifiedForSelectedEnrollment
      )
    : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.enrollment_id) {
      setError("Please select an enrollment.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }

    if (!form.payment_date) {
      setError("Please select the payment date.");
      return;
    }

    if (amount > outstandingForSelectedEnrollment) {
      setError(
        `Amount exceeds outstanding balance of ₹${formatMoney(
          outstandingForSelectedEnrollment
        )}.`
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("payments").insert({
        enrollment_id: form.enrollment_id,
        amount,
        payment_method: form.payment_method,
        transaction_reference: form.transaction_reference.trim() || null,
        payment_date: form.payment_date,
        payment_status: "pending",
        notes: form.notes.trim() || null
      });

      if (error) throw error;

      setModalOpen(false);
      setForm({ ...initialForm });
      setSuccess("Payment recorded successfully and marked as Pending.");

      await fetchData();
    } catch (err) {
      console.error("Payment creation error:", err);
      setError(err.message || "Unable to record payment.");
    } finally {
      setSaving(false);
    }
  };

  // Admin can move a payment between Pending, Verified and Rejected.
  const updatePaymentStatus = async (payment, nextStatus) => {
    if (!["pending", "verified", "rejected"].includes(nextStatus)) return;
    if (payment.payment_status === nextStatus) return;

    const studentName = getStudentName(payment.enrollment_id);

    const confirmed = window.confirm(
      `Change payment status from ${payment.payment_status} to ${nextStatus} for ${studentName}?`
    );

    if (!confirmed) return;

    setProcessingId(payment.id);
    setError("");
    setSuccess("");

    try {
      if (nextStatus === "verified") {
        const enrollment = getEnrollment(payment.enrollment_id);

        if (!enrollment) {
          throw new Error("Associated enrollment could not be found.");
        }

        const otherVerifiedAmount = payments
          .filter(
            (item) =>
              item.enrollment_id === payment.enrollment_id &&
              item.id !== payment.id &&
              item.payment_status === "verified"
          )
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const remaining =
          Number(enrollment.total_fee || 0) - otherVerifiedAmount;

        if (Number(payment.amount) > remaining) {
          throw new Error(
            `Cannot verify. Only ₹${formatMoney(
              Math.max(0, remaining)
            )} remains outstanding.`
          );
        }
      }

      const { data, error } = await supabase
        .from("payments")
        .update({ payment_status: nextStatus })
        .eq("id", payment.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) {
        throw new Error("Payment was not updated. Please refresh and try again.");
      }

      setSuccess(
        nextStatus === "pending"
          ? "Payment successfully reverted to Pending."
          : `Payment ${nextStatus} successfully.`
      );

      await fetchData();
    } catch (err) {
      console.error("Payment status update error:", err);
      setError(err.message || "Unable to update payment status.");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete a payment record. The existing Supabase trigger recalculates
  // the enrollment's paid amount and payment status automatically.
  const deletePayment = async (payment) => {
    const confirmed = window.confirm(
      `Permanently delete the payment of ₹${formatMoney(
        payment.amount
      )} for ${getStudentName(payment.enrollment_id)}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setProcessingId(payment.id);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) {
        throw new Error("Payment could not be deleted. Please refresh.");
      }

      setSuccess(
        "Payment record deleted. Enrollment payment totals have been recalculated."
      );

      await fetchData();
    } catch (err) {
      console.error("Payment deletion error:", err);
      setError(err.message || "Unable to delete payment.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <span className="payments-eyebrow">ACADEMY MANAGEMENT</span>
          <h1>Payments</h1>
          <p>Record, verify and manage student payments.</p>
        </div>

        <button className="payment-add-button" onClick={openAddModal}>
          <Plus size={18} />
          Record Payment
        </button>
      </div>

      {error && !modalOpen && (
        <div className="payments-alert error">
          {error}
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="payments-alert success">
          {success}
          <button onClick={() => setSuccess("")}><X size={16} /></button>
        </div>
      )}

      <div className="payments-summary-grid">
        <div className="payment-summary-card">
          <div className="payment-summary-icon blue"><Receipt size={22} /></div>
          <div><span>Total Payments</span><h2>{loading ? "..." : totals.total}</h2></div>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon orange"><Clock size={22} /></div>
          <div><span>Pending Verification</span><h2>{loading ? "..." : totals.pending}</h2></div>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon green"><CheckCircle size={22} /></div>
          <div><span>Verified Amount</span><h2>₹{loading ? "..." : formatMoney(verifiedAmount)}</h2></div>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon purple"><XCircle size={22} /></div>
          <div><span>Rejected Payments</span><h2>{loading ? "..." : totals.rejected}</h2></div>
        </div>
      </div>

      <div className="payments-table-container">
        <div className="payments-table-header">
          <div>
            <h3>Payment Records</h3>
            <p>Review student payment entries and verification status.</p>
          </div>

          <div className="payments-filters">
            <div className="payments-search">
              <Search size={17} />
              <input
                placeholder="Search student or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>

            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="all">All Methods</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>

            <button className="payments-refresh" onClick={fetchData} disabled={loading}>
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="payments-table-scroll">
          <table className="payments-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>PAYMENT DATE</th>
                <th>METHOD</th>
                <th>REFERENCE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="payments-empty">Loading payment records...</td></tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="payment-student-cell">
                        <div className="payment-student-avatar">
                          {getStudentName(payment.enrollment_id).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{getStudentName(payment.enrollment_id)}</strong>
                          <span>{getStudentEmail(payment.enrollment_id)}</span>
                        </div>
                      </div>
                    </td>

                    <td>{formatDate(payment.payment_date)}</td>
                    <td><span className="payment-method">{payment.payment_method}</span></td>
                    <td className="payment-reference">{payment.transaction_reference || "—"}</td>
                    <td><strong className="payment-amount">₹{formatMoney(payment.amount)}</strong></td>

                    <td>
                      <span className={`payment-status ${payment.payment_status}`}>
                        {payment.payment_status?.charAt(0).toUpperCase() +
                          payment.payment_status?.slice(1)}
                      </span>
                    </td>

                    <td>
                      <div className="payment-action-buttons">
                        {payment.payment_status === "pending" ? (
                          <>
                            <button
                              className="payment-verify-button"
                              disabled={processingId === payment.id}
                              onClick={() => updatePaymentStatus(payment, "verified")}
                              title="Verify payment"
                            >
                              <CheckCircle size={15} /> Verify
                            </button>
                            <button
                              className="payment-reject-button"
                              disabled={processingId === payment.id}
                              onClick={() => updatePaymentStatus(payment, "rejected")}
                              title="Reject payment"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="payment-revert-button"
                            disabled={processingId === payment.id}
                            onClick={() => updatePaymentStatus(payment, "pending")}
                            title="Revert to Pending"
                          >
                            <RotateCcw size={14} /> Revert
                          </button>
                        )}

                        <button
                          className="payment-delete-button"
                          disabled={processingId === payment.id}
                          onClick={() => deletePayment(payment)}
                          title="Delete payment"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="payments-empty">
                    <div>
                      <CreditCard size={38} />
                      <h3>
                        {search || statusFilter !== "all" || methodFilter !== "all"
                          ? "No matching payments found"
                          : "No payment records yet"}
                      </h3>
                      <p>
                        {search || statusFilter !== "all" || methodFilter !== "all"
                          ? "Try changing your search or filters."
                          : "Payment entries will appear here when recorded by Admin."}
                      </p>
                      {!search && statusFilter === "all" && methodFilter === "all" && (
                        <button onClick={openAddModal}><Plus size={16} /> Record First Payment</button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payments-table-footer">
          Showing {loading ? "..." : filteredPayments.length} of {payments.length} payment records
        </div>
      </div>

      {modalOpen && (
        <div
          className="payment-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="payment-modal">
            <div className="payment-modal-header">
              <div>
                <span>PAYMENT MANAGEMENT</span>
                <h2>Record Student Payment</h2>
                <p>Record payment details for an existing student enrollment.</p>
              </div>
              <button onClick={closeModal} disabled={saving} aria-label="Close">
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="payment-form-grid">
                <label className="payment-full-field">
                  Select Student Enrollment *
                  <select
                    name="enrollment_id"
                    value={form.enrollment_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose an enrollment</option>
                    {enrollments
                      .filter((e) => e.enrollment_status !== "cancelled")
                      .map((enrollment) => {
                        const student = getStudent(enrollment.student_id);
                        const outstanding = Math.max(
                          0,
                          Number(enrollment.total_fee || 0) -
                            Number(enrollment.amount_paid || 0)
                        );

                        return (
                          <option key={enrollment.id} value={enrollment.id}>
                            {student?.full_name || "Student"} — Outstanding ₹{formatMoney(outstanding)}
                          </option>
                        );
                      })}
                  </select>
                </label>

                {selectedEnrollment && (
                  <div className="payment-balance-panel payment-full-field">
                    <div><span>Total Fee</span><strong>₹{formatMoney(selectedEnrollment.total_fee)}</strong></div>
                    <div><span>Verified Paid</span><strong>₹{formatMoney(verifiedForSelectedEnrollment)}</strong></div>
                    <div><span>Outstanding</span><strong>₹{formatMoney(outstandingForSelectedEnrollment)}</strong></div>
                  </div>
                )}

                <label>
                  Payment Amount (₹) *
                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    max={outstandingForSelectedEnrollment || undefined}
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    required
                  />
                </label>

                <label>
                  Payment Method *
                  <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Payment Date *
                  <input type="date" name="payment_date" value={form.payment_date} onChange={handleChange} required />
                </label>

                <label>
                  Transaction Reference
                  <input
                    name="transaction_reference"
                    value={form.transaction_reference}
                    onChange={handleChange}
                    placeholder="UPI / bank reference number"
                  />
                </label>

                <label className="payment-full-field">
                  Admin Notes
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Optional internal payment notes..."
                  />
                </label>
              </div>

              <div className="payment-pending-note">
                <Clock size={17} />
                This payment will be saved as Pending. Verify it separately after checking the payment.
              </div>

              {enrollments.length === 0 && (
                <div className="payment-modal-error">
                  No enrollments are available. Create a student enrollment first.
                </div>
              )}

              {error && <div className="payment-modal-error">{error}</div>}

              <div className="payment-modal-actions">
                <button type="button" className="payment-cancel-button" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="payment-save-button" disabled={saving || enrollments.length === 0}>
                  {saving ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
