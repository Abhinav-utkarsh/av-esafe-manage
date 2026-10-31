
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  LogOut,
  BookOpen,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Layers,
  User,
  Phone,
  MessageCircle,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [enrollmentItems, setEnrollmentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // REACH OUT FORM STATE
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState("");
  const [messageError, setMessageError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setEnrollmentItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("enrollment_items")
        .select(`
          id,
          course_title_snapshot,
          price_snapshot,
          progress_percentage,
          progress_notes,
          item_status,
          progress_updated_at,
          created_at,
          batches (
            id,
            batch_name,
            batch_code,
            start_date,
            end_date,
            trainer_name,
            mentor_contact_number,
            status
          ),
          enrollments!inner (
            id,
            student_id,
            enrollment_type,
            enrollment_date,
            enrollment_status,
            total_fee,
            amount_paid,
            payment_status,
            bundle_id,
            bundles (
              id,
              title,
              bundle_code,
              price
            )
          )
        `)
        .eq("enrollments.student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEnrollmentItems(data || []);
    } catch (err) {
      console.error("Student dashboard loading error:", err);
      setError(err.message || "Unable to load your dashboard information.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // SUBMIT STUDENT MESSAGE
  const handleSendMessage = async (event) => {
    event.preventDefault();

    setMessageError("");
    setMessageSuccess("");

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setMessageError("Please enter your message before submitting.");
      return;
    }

    if (trimmedMessage.length > 5000) {
      setMessageError("Your message cannot exceed 5,000 characters.");
      return;
    }

    if (!user?.id) {
      setMessageError("Your session has expired. Please log in again.");
      return;
    }

    setSendingMessage(true);

    try {
      const { error } = await supabase
        .from("student_messages")
        .insert({
          student_id: user.id,
          message: trimmedMessage,
        });

      if (error) throw error;

      setMessage("");
      setMessageSuccess(
        "Your message has been sent successfully! Our team will get back to you."
      );
    } catch (err) {
      console.error("Message submission error:", err);
      setMessageError(
        err.message || "Unable to send your message. Please try again."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // UNIQUE ENROLLMENT RECORDS
  const enrollmentRecords = useMemo(() => {
    const unique = new Map();

    enrollmentItems.forEach((item) => {
      const enrollment = item.enrollments;

      if (enrollment?.id && !unique.has(enrollment.id)) {
        unique.set(enrollment.id, enrollment);
      }
    });

    return Array.from(unique.values());
  }, [enrollmentItems]);

  // PAYMENT CALCULATIONS
  const totalFee = enrollmentRecords.reduce(
    (sum, enrollment) => sum + Number(enrollment.total_fee || 0),
    0
  );

  const totalPaid = enrollmentRecords.reduce(
    (sum, enrollment) => sum + Number(enrollment.amount_paid || 0),
    0
  );

  const totalPending = Math.max(0, totalFee - totalPaid);

  // LEARNING PROGRESS
  const overallProgress = enrollmentItems.length
    ? Math.round(
        enrollmentItems.reduce(
          (sum, item) => sum + Number(item.progress_percentage || 0),
          0
        ) / enrollmentItems.length
      )
    : 0;

  const completedServices = enrollmentItems.filter(
    (item) => item.item_status === "completed"
  ).length;

  const activeServices = enrollmentItems.filter(
    (item) => item.item_status === "active"
  ).length;

  // PURCHASED BUNDLES
  const bundles = useMemo(() => {
    const unique = new Map();

    enrollmentRecords.forEach((enrollment) => {
      if (
        enrollment.bundle_id &&
        enrollment.bundles?.id &&
        !unique.has(enrollment.bundle_id)
      ) {
        unique.set(enrollment.bundle_id, enrollment.bundles);
      }
    });

    return Array.from(unique.values());
  }, [enrollmentRecords]);

  // RECENT PROGRESS UPDATES
  const recentUpdates = useMemo(() => {
    return enrollmentItems
      .filter((item) => item.progress_updated_at)
      .sort(
        (a, b) =>
          new Date(b.progress_updated_at) -
          new Date(a.progress_updated_at)
      )
      .slice(0, 5);
  }, [enrollmentItems]);

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) => {
    if (!date) return "Not scheduled";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Not scheduled";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "Not updated";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Not updated";

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = (status) => {
    if (status === "on_hold") return "On Hold";

    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Active";
  };

  const paymentStatusLabel = (status) => {
    if (status === "paid") return "Paid";
    if (status === "partial") return "Partially Paid";
    if (status === "pending") return "Pending";

    return status || "Pending";
  };

  // LOGOUT
  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err.message);
      setLoggingOut(false);
    }
  };

  return (
    <div className="student-dashboard">
      {/* TOP NAVIGATION */}
      <header className="student-topbar">
        <div className="student-brand">
          <div className="student-brand-icon">
            <GraduationCap size={23} />
          </div>

          <div>
            <h2>Av_eSAFE</h2>
            <span>ACADEMY</span>
          </div>
        </div>

        <div className="student-topbar-right">
          <div className="student-user-avatar">
            {(profile?.full_name || "S").charAt(0).toUpperCase()}
          </div>

          <div className="student-user-info">
            <strong>{profile?.full_name || "Student"}</strong>
            <span>Student</span>
          </div>

          <button
            className="student-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={17} />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <main className="student-dashboard-main">
        {/* WELCOME SECTION */}
        <section className="student-welcome-section">
          <div>
            <span className="student-dashboard-eyebrow">
              STUDENT PORTAL
            </span>

            <h1>
              Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}!
            </h1>

            <p>
              Track your learning journey, monitor progress and stay updated
              with your training.
            </p>
          </div>

          <div className="student-welcome-icon">
            <GraduationCap size={55} />
          </div>
        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="student-dashboard-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={fetchDashboardData}>Try again</button>
          </div>
        )}

        {/* SECTION HEADING */}
        <div className="student-dashboard-section-heading">
          <div>
            <h2>My Learning Overview</h2>
            <p>Your training information at a glance.</p>
          </div>

          <button
            className="student-refresh-button"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <section className="student-stats-grid">
          <div className="student-stat-card">
            <div className="student-stat-icon blue">
              <BookOpen size={22} />
            </div>
            <div>
              <span>Enrolled Services</span>
              <h3>{loading ? "..." : enrollmentItems.length}</h3>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon green">
              <TrendingUp size={22} />
            </div>
            <div>
              <span>Overall Progress</span>
              <h3>{loading ? "..." : `${overallProgress}%`}</h3>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon purple">
              <CheckCircle size={22} />
            </div>
            <div>
              <span>Completed Services</span>
              <h3>{loading ? "..." : completedServices}</h3>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon orange">
              <Clock size={22} />
            </div>
            <div>
              <span>Active Services</span>
              <h3>{loading ? "..." : activeServices}</h3>
            </div>
          </div>
        </section>

        {/* COURSES AND SERVICES */}
        <section className="student-section-card">
          <div className="student-card-heading">
            <div>
              <h2>My Courses & Services</h2>
              <p>All your purchased training services.</p>
            </div>

            <BookOpen size={21} />
          </div>

          {loading ? (
            <div className="student-loading">
              Loading your courses...
            </div>
          ) : enrollmentItems.length > 0 ? (
            <div className="student-course-grid">
              {enrollmentItems.map((item) => {
                const percentage = Math.min(
                  100,
                  Math.max(0, Number(item.progress_percentage || 0))
                );

                const mentorPhone = item.batches?.mentor_contact_number;

                const dialablePhone = mentorPhone
                  ? mentorPhone.replace(/[^\d+]/g, "")
                  : "";

                return (
                  <article className="student-course-card" key={item.id}>
                    <div className="student-course-top">
                      <div className="student-course-icon">
                        <BookOpen size={21} />
                      </div>

                      <span
                        className={`student-course-status ${item.item_status}`}
                      >
                        {statusLabel(item.item_status)}
                      </span>
                    </div>

                    <h3>{item.course_title_snapshot}</h3>

                    <p className="student-course-price">
                      {formatCurrency(item.price_snapshot)}
                    </p>

                    <div className="student-course-progress-label">
                      <span>Learning Progress</span>
                      <strong>{percentage}%</strong>
                    </div>

                    <div className="student-progress-track">
                      <div
                        className="student-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {item.progress_notes && (
                      <div className="student-course-note">
                        <strong>Latest feedback</strong>
                        <p>{item.progress_notes}</p>
                      </div>
                    )}

                    {/* BATCH AND MENTOR DETAILS */}
                    <div className="student-course-details">
                      <div>
                        <CalendarDays size={15} />
                        <span>
                          {item.batches?.batch_name || "Batch not assigned"}
                        </span>
                      </div>

                      {item.batches?.start_date && (
                        <div>
                          <Clock size={15} />
                          <span>
                            Starts {formatDate(item.batches.start_date)}
                          </span>
                        </div>
                      )}

                      {item.batches?.trainer_name && (
                        <div>
                          <User size={15} />
                          <span>
                            Mentor: {item.batches.trainer_name}
                          </span>
                        </div>
                      )}

                      {mentorPhone && (
                        <div>
                          <Phone size={15} />
                          <a
                            href={`tel:${dialablePhone}`}
                            className="student-mentor-phone"
                          >
                            {mentorPhone}
                          </a>
                        </div>
                      )}

                      {!item.batches?.trainer_name && !mentorPhone && (
                        <div>
                          <User size={15} />
                          <span>Mentor details not assigned yet</span>
                        </div>
                      )}
                    </div>

                    <div className="student-course-updated">
                      Last updated: {formatDateTime(item.progress_updated_at)}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="student-empty-state">
              <BookOpen size={38} />
              <h3>No courses enrolled yet</h3>
              <p>
                Your purchased courses and services will appear here once
                your enrollment is created by the Academy Admin.
              </p>
            </div>
          )}
        </section>

        {/* PURCHASED BUNDLES */}
        {bundles.length > 0 && (
          <section className="student-section-card">
            <div className="student-card-heading">
              <div>
                <h2>My Purchased Bundles</h2>
                <p>Your combined training packages.</p>
              </div>

              <Layers size={21} />
            </div>

            <div className="student-bundle-grid">
              {bundles.map((bundle) => (
                <div className="student-bundle-card" key={bundle.id}>
                  <div className="student-bundle-icon">
                    <Layers size={24} />
                  </div>

                  <div>
                    <h3>{bundle.title}</h3>
                    <span>{bundle.bundle_code}</span>
                  </div>

                  <strong>{formatCurrency(bundle.price)}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PAYMENT SUMMARY */}
        <section className="student-section-card">
          <div className="student-card-heading">
            <div>
              <h2>My Payment Summary</h2>
              <p>Overview of your enrollment payments.</p>
            </div>

            <Wallet size={21} />
          </div>

          <div className="student-payment-grid">
            <div className="student-payment-card">
              <span>Total Enrollment Fee</span>
              <h3>
                {loading ? "..." : formatCurrency(totalFee)}
              </h3>
            </div>

            <div className="student-payment-card paid">
              <span>Total Paid</span>
              <h3>
                {loading ? "..." : formatCurrency(totalPaid)}
              </h3>
            </div>

            <div className="student-payment-card pending">
              <span>Outstanding Amount</span>
              <h3>
                {loading ? "..." : formatCurrency(totalPending)}
              </h3>
            </div>
          </div>

          {!loading && enrollmentRecords.length > 0 && (
            <div className="student-payment-records">
              {enrollmentRecords.map((enrollment) => (
                <div className="student-payment-row" key={enrollment.id}>
                  <div>
                    <strong>
                      {enrollment.enrollment_type === "bundle"
                        ? enrollment.bundles?.title || "Bundle Enrollment"
                        : "Individual Enrollment"}
                    </strong>

                    <span>
                      Enrolled on {formatDate(enrollment.enrollment_date)}
                    </span>
                  </div>

                  <div className="student-payment-row-right">
                    <strong>
                      {formatCurrency(enrollment.total_fee)}
                    </strong>

                    <span
                      className={`student-payment-status ${enrollment.payment_status}`}
                    >
                      {paymentStatusLabel(enrollment.payment_status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="student-payment-information">
            <AlertCircle size={15} />
            Payment verification and account updates are managed by Academy
            Admin.
          </p>
        </section>

        {/* RECENT LEARNING UPDATES */}
        <section className="student-section-card">
          <div className="student-card-heading">
            <div>
              <h2>Recent Learning Updates</h2>
              <p>
                Latest progress updates from your trainer or Academy Admin.
              </p>
            </div>

            <TrendingUp size={21} />
          </div>

          {loading ? (
            <div className="student-loading">
              Loading recent updates...
            </div>
          ) : recentUpdates.length > 0 ? (
            <div className="student-updates-list">
              {recentUpdates.map((item) => (
                <div className="student-update-item" key={item.id}>
                  <div className="student-update-icon">
                    <CheckCircle size={18} />
                  </div>

                  <div className="student-update-content">
                    <strong>{item.course_title_snapshot}</strong>

                    <p>
                      Your learning progress is now{" "}
                      <strong>{item.progress_percentage}%</strong>.
                      {item.progress_notes
                        ? ` ${item.progress_notes}`
                        : ""}
                    </p>

                    <span>
                      {formatDateTime(item.progress_updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="student-empty-state compact">
              <TrendingUp size={30} />
              <h3>No progress updates yet</h3>
              <p>Your progress updates will appear here.</p>
            </div>
          )}
        </section>

        {/* REACH OUT TO US */}
        <section className="student-section-card student-reachout-card">
          <div className="student-card-heading">
            <div>
              <h2>Reach Out to Us</h2>
              <p>
                Have a question, doubt or need assistance? Send us a message.
                Our Academy team will get back to you.
              </p>
            </div>

            <MessageCircle size={24} />
          </div>

          <form
            className="student-reachout-form"
            onSubmit={handleSendMessage}
          >
            <label htmlFor="student-message">
              Your Message
            </label>

            <textarea
              id="student-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setMessageError("");
                setMessageSuccess("");
              }}
              placeholder="Write your question or message here..."
              maxLength={5000}
              rows={5}
              disabled={sendingMessage}
            />

            <div className="student-reachout-form-bottom">
              <span className="student-reachout-counter">
                {message.length}/5000 characters
              </span>

              <button
                type="submit"
                className="student-reachout-submit"
                disabled={sendingMessage || !message.trim()}
              >
                {sendingMessage ? (
                  <>
                    <RefreshCw size={17} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Send Message
                  </>
                )}
              </button>
            </div>

            {messageSuccess && (
              <div className="student-reachout-feedback success">
                <CheckCircle2 size={19} />
                <span>{messageSuccess}</span>
              </div>
            )}

            {messageError && (
              <div className="student-reachout-feedback error">
                <AlertCircle size={19} />
                <span>{messageError}</span>
              </div>
            )}
          </form>
        </section>

        {/* PROFILE INFORMATION */}
        <section className="student-profile-card">
          <div className="student-profile-icon">
            <User size={22} />
          </div>

          <div className="student-profile-details">
            <h3>My Account</h3>
            <p>{profile?.full_name || "Student"}</p>
            <span>{profile?.email || user?.email}</span>
          </div>

          <span className="student-profile-role">
            Student Account
          </span>
        </section>

        {/* FOOTER */}
        <footer className="student-dashboard-footer">
          <div className="student-brand-footer">
            <GraduationCap size={19} />
            <strong>Av_eSAFE Academy</strong>
          </div>

          <span>Learn. Build. Become Career-Ready.</span>
        </footer>
      </main>
    </div>
  );
}
