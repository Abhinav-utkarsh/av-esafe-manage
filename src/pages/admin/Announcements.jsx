
import { useCallback, useEffect, useState } from "react";

import {
  Megaphone,
  Plus,
  RefreshCw,
  CalendarDays,
  Clock,
  Users,
  BookOpen,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  Send,
  ClipboardList,
  ShieldCheck,
  Info
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

import "./Announcements.css";

const INITIAL_FORM = {
  title: "",
  message: "",
  category: "general",
  audience_type: "all",
  audience_batch_id: "",
  audience_course_id: "",
  event_date: "",
  event_time: "",
  expires_at: ""
};

const CATEGORY_OPTIONS = [
  { value: "general", label: "General Announcement" },
  { value: "exam", label: "Exam Schedule" },
  { value: "batch", label: "Batch Update" },
  { value: "holiday", label: "Holiday Notice" },
  { value: "important", label: "Important Notice" }
];

export default function Announcements() {
  const { profile, isSuperAdmin } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);

  const [announcements, setAnnouncements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState("");

  // ------------------------------------------
  // DATE HELPERS
  // ------------------------------------------

  const formatDate = (value) => {
    if (!value) return "Not specified";

    return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "Not specified";

    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (value) => {
    if (!value) return "";

    const [hours, minutes] = value.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCategoryLabel = (category) => {
    return (
      CATEGORY_OPTIONS.find((item) => item.value === category)?.label ||
      category ||
      "General"
    );
  };

  const getAudienceLabel = (announcement) => {
    if (announcement.audience_type === "batch") {
      return announcement.batch?.batch_name ||
        announcement.batch?.batch_code ||
        "Selected Batch";
    }

    if (announcement.audience_type === "course") {
      return announcement.course?.title || "Selected Course";
    }

    return "All Active Students";
  };

  // ------------------------------------------
  // LOAD ANNOUNCEMENTS, BATCHES AND COURSES
  // ------------------------------------------

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let announcementQuery = supabase
        .from("academy_announcements")
        .select(`
          *,
          batch:batches!academy_announcements_audience_batch_id_fkey (
            id,
            batch_name,
            batch_code
          ),
          course:courses!academy_announcements_audience_course_id_fkey (
            id,
            title
          )
        `)
        .order("created_at", { ascending: false });

      // Regular Admin sees only their own submissions.
      // Super Admin sees all announcements.
      if (!isSuperAdmin) {
        announcementQuery = announcementQuery.eq(
          "created_by",
          profile.id
        );
      }

      const [
        announcementResult,
        batchesResult,
        coursesResult
      ] = await Promise.all([
        announcementQuery,

        supabase
          .from("batches")
          .select("id, batch_name, batch_code, status")
          .in("status", ["upcoming", "ongoing"])
          .order("start_date", { ascending: true }),

        supabase
          .from("courses")
          .select("id, title, course_code")
          .eq("is_active", true)
          .order("title", { ascending: true })
      ]);

      if (announcementResult.error) {
        throw announcementResult.error;
      }

      if (batchesResult.error) {
        throw batchesResult.error;
      }

      if (coursesResult.error) {
        throw coursesResult.error;
      }

      setAnnouncements(announcementResult.data || []);
      setBatches(batchesResult.data || []);
      setCourses(coursesResult.data || []);

    } catch (err) {
      console.error("Announcement loading error:", err);
      setError(err.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    fetchPageData();

    const channel = supabase
      .channel("academy-announcements-admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "academy_announcements"
        },
        () => {
          fetchPageData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPageData, profile?.id]);

  // ------------------------------------------
  // FORM HANDLING
  // ------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value
      };

      if (name === "audience_type") {
        updated.audience_batch_id = "";
        updated.audience_course_id = "";
      }

      return updated;
    });

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  // ------------------------------------------
  // SUBMIT ANNOUNCEMENT
  // ------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!profile?.id) {
      setError("Unable to identify the logged-in Admin.");
      return;
    }

    if (isSuperAdmin) {
      setError(
        "Super Admin reviews announcements. Only regular Admins can submit them."
      );
      return;
    }

    if (
      form.audience_type === "batch" &&
      !form.audience_batch_id
    ) {
      setError("Please select a batch.");
      return;
    }

    if (
      form.audience_type === "course" &&
      !form.audience_course_id
    ) {
      setError("Please select a course.");
      return;
    }

    if (!form.expires_at) {
      setError("Please select an expiry date and time.");
      return;
    }

    const expiryDate = new Date(form.expires_at);

    if (
      Number.isNaN(expiryDate.getTime()) ||
      expiryDate.getTime() <= Date.now()
    ) {
      setError("Expiry date and time must be in the future.");
      return;
    }

    if (form.event_date) {
      const eventDate = new Date(`${form.event_date}T00:00:00`);

      if (eventDate.getTime() < new Date().setHours(0, 0, 0, 0)) {
        setError("Event date cannot be in the past.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        category: form.category,

        audience_type: form.audience_type,

        audience_batch_id:
          form.audience_type === "batch"
            ? form.audience_batch_id
            : null,

        audience_course_id:
          form.audience_type === "course"
            ? form.audience_course_id
            : null,

        event_date: form.event_date || null,
        event_time: form.event_time || null,

        expires_at: expiryDate.toISOString(),

        created_by: profile.id,
        status: "pending"
      };

      const { error: insertError } = await supabase
        .from("academy_announcements")
        .insert(payload);

      if (insertError) throw insertError;

      setSuccess(
        "Announcement submitted successfully. It is now waiting for Super Admin approval."
      );

      resetForm();

      await fetchPageData();

    } catch (err) {
      console.error("Announcement submission error:", err);

      setError(
        err.message || "Unable to submit announcement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------
  // OPEN REVIEW MODAL
  // ------------------------------------------

  const openReviewModal = (announcement, action) => {
    setSelectedAnnouncement(announcement);
    setReviewAction(action);
    setRejectionReason("");
    setError("");
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    if (reviewingId) return;

    setShowReviewModal(false);
    setSelectedAnnouncement(null);
    setRejectionReason("");
    setReviewAction("");
  };

  // ------------------------------------------
  // APPROVE OR REJECT ANNOUNCEMENT
  // ------------------------------------------

  const handleReview = async (event) => {
    event.preventDefault();

    if (!isSuperAdmin) {
      setError("Only Super Admin can review announcements.");
      return;
    }

    if (!selectedAnnouncement?.id) return;

    if (
      reviewAction === "rejected" &&
      !rejectionReason.trim()
    ) {
      setError("Please provide a rejection reason.");
      return;
    }

    setReviewingId(selectedAnnouncement.id);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const reviewerId = authData.user?.id;

      if (!reviewerId || reviewerId !== profile?.id) {
        throw new Error("Unable to verify the logged-in reviewer.");
      }

      const { data, error: updateError } = await supabase
        .from("academy_announcements")
        .update({
          status: reviewAction,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          rejection_reason:
            reviewAction === "rejected"
              ? rejectionReason.trim()
              : null
        })
        .eq("id", selectedAnnouncement.id)
        .eq("status", "pending")
        .select("id");

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          "This announcement is no longer pending or you do not have permission to review it."
        );
      }

      setSuccess(
        reviewAction === "approved"
          ? "Announcement approved successfully."
          : "Announcement rejected successfully."
      );

      setShowReviewModal(false);
      setSelectedAnnouncement(null);
      setRejectionReason("");
      setReviewAction("");

      await fetchPageData();

    } catch (err) {
      console.error("Announcement review error:", err);
      setError(err.message || "Unable to review announcement.");
    } finally {
      setReviewingId(null);
    }
  };

  // ------------------------------------------
  // FILTER ANNOUNCEMENTS
  // ------------------------------------------

  const pendingAnnouncements = announcements.filter(
    (item) => item.status === "pending"
  );

  const approvedAnnouncements = announcements.filter(
    (item) => item.status === "approved"
  );

  const rejectedAnnouncements = announcements.filter(
    (item) => item.status === "rejected"
  );

  const displayedAnnouncements =
    activeTab === "pending"
      ? pendingAnnouncements
      : activeTab === "approved"
        ? approvedAnnouncements
        : rejectedAnnouncements;

  // ------------------------------------------
  // RENDER STATUS
  // ------------------------------------------

  const renderStatus = (status) => {
    const statusConfig = {
      pending: {
        label: "Pending Approval",
        icon: Clock,
        className: "announcement-status-pending"
      },
      approved: {
        label: "Approved",
        icon: CheckCircle2,
        className: "announcement-status-approved"
      },
      rejected: {
        label: "Rejected",
        icon: XCircle,
        className: "announcement-status-rejected"
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`announcement-status ${config.className}`}>
        <Icon size={13} />
        {config.label}
      </span>
    );
  };

  // ------------------------------------------
  // PAGE
  // ------------------------------------------

  return (
    <div className="announcements-page">

      {/* PAGE HEADER */}

      <div className="announcements-page-header">
        <div>
          <span className="announcement-eyebrow">
            ACADEMY COMMUNICATION
          </span>

          <h1>
            {isSuperAdmin
              ? "Announcement Approvals"
              : "Announcements"}
          </h1>

          <p>
            {isSuperAdmin
              ? "Review and approve announcements submitted by Admins."
              : "Create academy announcements and submit them for approval."}
          </p>
        </div>

        <button
          type="button"
          className="announcement-refresh-button"
          onClick={fetchPageData}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "announcement-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="announcement-alert announcement-alert-error">
          <AlertCircle size={17} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="announcement-alert announcement-alert-success">
          <CheckCircle2 size={17} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* SUPER ADMIN SUMMARY */}

      {isSuperAdmin && (
        <div className="announcement-summary-grid">

          <div className="announcement-summary-card">
            <div className="announcement-summary-icon summary-orange">
              <Clock size={19} />
            </div>

            <div>
              <strong>{pendingAnnouncements.length}</strong>
              <span>Pending Approval</span>
            </div>
          </div>

          <div className="announcement-summary-card">
            <div className="announcement-summary-icon summary-green">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <strong>{approvedAnnouncements.length}</strong>
              <span>Approved</span>
            </div>
          </div>

          <div className="announcement-summary-card">
            <div className="announcement-summary-icon summary-red">
              <XCircle size={19} />
            </div>

            <div>
              <strong>{rejectedAnnouncements.length}</strong>
              <span>Rejected</span>
            </div>
          </div>

        </div>
      )}

      {/* ADMIN CREATION FORM */}

      {!isSuperAdmin && (
        <section className="announcement-form-panel">

          <div className="announcement-panel-heading">
            <div className="announcement-heading-icon">
              <Megaphone size={21} />
            </div>

            <div>
              <h3>Create Announcement</h3>
              <p>
                Submit an official notification for Super Admin approval.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="announcement-form">

            <div className="announcement-field">
              <label htmlFor="announcement-title">
                Notification Title <span>*</span>
              </label>

              <input
                id="announcement-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Java Assessment Schedule - November"
                maxLength={150}
                required
              />
            </div>

            <div className="announcement-field">
              <label htmlFor="announcement-category">
                Notification Category <span>*</span>
              </label>

              <select
                id="announcement-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="announcement-field announcement-field-full">
              <label htmlFor="announcement-message">
                Notification Message <span>*</span>
              </label>

              <textarea
                id="announcement-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write the complete announcement details for students..."
                rows={5}
                maxLength={5000}
                required
              />

              <small>
                {form.message.length}/5000 characters
              </small>
            </div>

            {/* AUDIENCE */}

            <div className="announcement-form-divider">
              <Users size={17} />
              <span>Notification Audience</span>
            </div>

            <div className="announcement-field">
              <label htmlFor="announcement-audience">
                Send Notification To <span>*</span>
              </label>

              <select
                id="announcement-audience"
                name="audience_type"
                value={form.audience_type}
                onChange={handleChange}
                required
              >
                <option value="all">All Active Students</option>
                <option value="batch">Selected Batch</option>
                <option value="course">Selected Course</option>
              </select>
            </div>

            {form.audience_type === "batch" && (
              <div className="announcement-field">
                <label htmlFor="announcement-batch">
                  Select Batch <span>*</span>
                </label>

                <select
                  id="announcement-batch"
                  name="audience_batch_id"
                  value={form.audience_batch_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a batch</option>

                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name} ({batch.batch_code})
                    </option>
                  ))}
                </select>

                {batches.length === 0 && (
                  <small>No upcoming or ongoing batches found.</small>
                )}
              </div>
            )}

            {form.audience_type === "course" && (
              <div className="announcement-field">
                <label htmlFor="announcement-course">
                  Select Course <span>*</span>
                </label>

                <select
                  id="announcement-course"
                  name="audience_course_id"
                  value={form.audience_course_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a course</option>

                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                      {course.course_code
                        ? ` (${course.course_code})`
                        : ""}
                    </option>
                  ))}
                </select>

                {courses.length === 0 && (
                  <small>No active courses found.</small>
                )}
              </div>
            )}

            {/* EVENT SCHEDULE */}

            <div className="announcement-form-divider">
              <CalendarDays size={17} />
              <span>Event / Exam Schedule (Optional)</span>
            </div>

            <div className="announcement-field">
              <label htmlFor="announcement-event-date">
                Event Date
              </label>

              <input
                id="announcement-event-date"
                type="date"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
                min={new Date().toLocaleDateString("en-CA")}
              />
            </div>

            <div className="announcement-field">
              <label htmlFor="announcement-event-time">
                Event Time
              </label>

              <input
                id="announcement-event-time"
                type="time"
                name="event_time"
                value={form.event_time}
                onChange={handleChange}
              />
            </div>

            {/* EXPIRY */}

            <div className="announcement-field announcement-field-full">
              <label htmlFor="announcement-expiry">
                Notification Expiry Date & Time <span>*</span>
              </label>

              <input
                id="announcement-expiry"
                type="datetime-local"
                name="expires_at"
                value={form.expires_at}
                onChange={handleChange}
                min={new Date(
                  Date.now() - new Date().getTimezoneOffset() * 60000
                ).toISOString().slice(0, 16)}
                required
              />

              <small>
                Mandatory. The notification will automatically disappear
                from the student dashboard after this date and time.
              </small>
            </div>

            {/* SUBMISSION INFORMATION */}

            <div className="announcement-submission-note announcement-field-full">
              <Info size={18} />

              <p>
                Your announcement will be submitted to Super Admin for
                approval. It will not be visible to students until approved.
              </p>
            </div>

            <div className="announcement-form-actions announcement-field-full">
              <button
                type="button"
                className="announcement-secondary-button"
                onClick={resetForm}
                disabled={submitting}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="announcement-primary-button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="announcement-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit for Approval
                  </>
                )}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* ANNOUNCEMENT HISTORY / APPROVAL QUEUE */}

      <section className="announcement-history-panel">

        <div className="announcement-history-heading">
          <div>
            <div className="announcement-heading-icon">
              {isSuperAdmin ? (
                <ShieldCheck size={21} />
              ) : (
                <ClipboardList size={21} />
              )}
            </div>

            <div>
              <h3>
                {isSuperAdmin
                  ? "Announcement Review Queue"
                  : "My Submitted Announcements"}
              </h3>

              <p>
                {isSuperAdmin
                  ? "Review submissions and manage their approval status."
                  : "Track the status of your submitted announcements."}
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}

        <div className="announcement-tabs">
          <button
            type="button"
            className={activeTab === "pending" ? "active" : ""}
            onClick={() => setActiveTab("pending")}
          >
            Pending
            <span>{pendingAnnouncements.length}</span>
          </button>

          <button
            type="button"
            className={activeTab === "approved" ? "active" : ""}
            onClick={() => setActiveTab("approved")}
          >
            Approved
            <span>{approvedAnnouncements.length}</span>
          </button>

          <button
            type="button"
            className={activeTab === "rejected" ? "active" : ""}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected
            <span>{rejectedAnnouncements.length}</span>
          </button>
        </div>

        {/* ANNOUNCEMENT LIST */}

        {loading ? (
          <div className="announcement-loading">
            <RefreshCw size={22} className="announcement-spin" />
            <p>Loading announcements...</p>
          </div>
        ) : displayedAnnouncements.length === 0 ? (
          <div className="announcement-empty">
            <Megaphone size={34} />

            <h4>
              No {activeTab} announcements
            </h4>

            <p>
              {activeTab === "pending"
                ? "There are currently no announcements waiting for approval."
                : `No ${activeTab} announcements found.`}
            </p>
          </div>
        ) : (
          <div className="announcement-list">
            {displayedAnnouncements.map((announcement) => (
              <article
                className="announcement-record"
                key={announcement.id}
              >
                <div className="announcement-record-main">

                  <div className="announcement-record-top">
                    <div className="announcement-record-title">
                      <h4>{announcement.title}</h4>
                      {renderStatus(announcement.status)}
                    </div>

                    <span className="announcement-category-tag">
                      {getCategoryLabel(announcement.category)}
                    </span>
                  </div>

                  <p className="announcement-record-message">
                    {announcement.message}
                  </p>

                  <div className="announcement-record-meta">
                    <span>
                      <Users size={13} />
                      {getAudienceLabel(announcement)}
                    </span>

                    <span>
                      <CalendarDays size={13} />
                      Expires: {formatDateTime(announcement.expires_at)}
                    </span>

                    <span>
                      <Clock size={13} />
                      Submitted: {formatDateTime(announcement.created_at)}
                    </span>
                  </div>

                  {announcement.event_date && (
                    <div className="announcement-event-info">
                      <CalendarDays size={14} />

                      <span>
                        Event: {formatDate(announcement.event_date)}
                        {announcement.event_time
                          ? ` at ${formatTime(announcement.event_time)}`
                          : ""}
                      </span>
                    </div>
                  )}

                  {announcement.status === "rejected" &&
                    announcement.rejection_reason && (
                      <div className="announcement-rejection-note">
                        <strong>Rejection reason:</strong>{" "}
                        {announcement.rejection_reason}
                      </div>
                    )}

                </div>

                <div className="announcement-record-actions">

                  <button
                    type="button"
                    className="announcement-view-button"
                    onClick={() => setSelectedAnnouncement(announcement)}
                    title="View full announcement"
                  >
                    <Eye size={15} />
                    Details
                  </button>

                  {isSuperAdmin &&
                    announcement.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="announcement-approve-button"
                          onClick={() =>
                            openReviewModal(announcement, "approved")
                          }
                          disabled={reviewingId === announcement.id}
                        >
                          <CheckCircle2 size={15} />
                          Approve
                        </button>

                        <button
                          type="button"
                          className="announcement-reject-button"
                          onClick={() =>
                            openReviewModal(announcement, "rejected")
                          }
                          disabled={reviewingId === announcement.id}
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                      </>
                    )}

                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ANNOUNCEMENT DETAILS MODAL */}

      {selectedAnnouncement && !showReviewModal && (
        <div
          className="announcement-modal-overlay"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="announcement-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="announcement-modal-header">
              <div>
                <span className="announcement-eyebrow">
                  ANNOUNCEMENT DETAILS
                </span>

                <h2>{selectedAnnouncement.title}</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="announcement-modal-body">
              <div className="announcement-detail-status">
                {renderStatus(selectedAnnouncement.status)}
                <span className="announcement-category-tag">
                  {getCategoryLabel(selectedAnnouncement.category)}
                </span>
              </div>

              <div className="announcement-detail-message">
                {selectedAnnouncement.message}
              </div>

              <div className="announcement-detail-grid">
                <div>
                  <span>Audience</span>
                  <strong>{getAudienceLabel(selectedAnnouncement)}</strong>
                </div>

                <div>
                  <span>Expiry</span>
                  <strong>
                    {formatDateTime(selectedAnnouncement.expires_at)}
                  </strong>
                </div>

                <div>
                  <span>Event Date</span>
                  <strong>
                    {formatDate(selectedAnnouncement.event_date)}
                  </strong>
                </div>

                <div>
                  <span>Event Time</span>
                  <strong>
                    {selectedAnnouncement.event_time
                      ? formatTime(selectedAnnouncement.event_time)
                      : "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Submitted</span>
                  <strong>
                    {formatDateTime(selectedAnnouncement.created_at)}
                  </strong>
                </div>

                <div>
                  <span>Reviewed</span>
                  <strong>
                    {selectedAnnouncement.reviewed_at
                      ? formatDateTime(selectedAnnouncement.reviewed_at)
                      : "Not reviewed"}
                  </strong>
                </div>
              </div>

              {selectedAnnouncement.rejection_reason && (
                <div className="announcement-rejection-note">
                  <strong>Rejection reason:</strong>{" "}
                  {selectedAnnouncement.rejection_reason}
                </div>
              )}
            </div>

            <div className="announcement-modal-footer">
              <button
                type="button"
                className="announcement-secondary-button"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL / REJECTION MODAL */}

      {showReviewModal && selectedAnnouncement && (
        <div
          className="announcement-modal-overlay"
          onClick={closeReviewModal}
        >
          <div
            className="announcement-modal announcement-review-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="announcement-modal-header">
              <div>
                <span className="announcement-eyebrow">
                  SUPER ADMIN REVIEW
                </span>

                <h2>
                  {reviewAction === "approved"
                    ? "Approve Announcement"
                    : "Reject Announcement"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                aria-label="Close review"
                disabled={Boolean(reviewingId)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleReview}>
              <div className="announcement-modal-body">
                <div className="announcement-review-preview">
                  <strong>{selectedAnnouncement.title}</strong>

                  <p>{selectedAnnouncement.message}</p>

                  <span>
                    Audience: {getAudienceLabel(selectedAnnouncement)}
                  </span>
                </div>

                {reviewAction === "approved" ? (
                  <div className="announcement-review-confirmation">
                    <CheckCircle2 size={22} />

                    <p>
                      Approving this announcement will make it visible
                      to the selected students, provided it has not expired.
                    </p>
                  </div>
                ) : (
                  <div className="announcement-field">
                    <label htmlFor="rejection-reason">
                      Rejection Reason <span>*</span>
                    </label>

                    <textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                      placeholder="Explain why this announcement is being rejected..."
                      rows={4}
                      maxLength={1000}
                      required
                    />

                    <small>
                      {rejectionReason.length}/1000 characters
                    </small>
                  </div>
                )}

                {error && (
                  <div className="announcement-alert announcement-alert-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>

              <div className="announcement-modal-footer">
                <button
                  type="button"
                  className="announcement-secondary-button"
                  onClick={closeReviewModal}
                  disabled={Boolean(reviewingId)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    reviewAction === "approved"
                      ? "announcement-approve-button"
                      : "announcement-reject-button"
                  }
                  disabled={Boolean(reviewingId)}
                >
                  {reviewingId ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="announcement-spin"
                      />
                      Processing...
                    </>
                  ) : reviewAction === "approved" ? (
                    <>
                      <CheckCircle2 size={15} />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <XCircle size={15} />
                      Confirm Rejection
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
