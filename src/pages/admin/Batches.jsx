import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  X,
  Users,
  Clock,
  BookOpen,
  Power,
  Phone,
  User,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./Batches.css";

const initialForm = {
  batch_code: "",
  batch_name: "",
  course_id: "",
  start_date: "",
  end_date: "",
  trainer_name: "",
  mentor_contact_number: "",
  max_students: "30",
  status: "upcoming",
};

const statuses = ["upcoming", "ongoing", "completed", "cancelled"];

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [form, setForm] = useState(initialForm);

  // FETCH BATCHES AND COURSES
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        { data: batchData, error: batchError },
        { data: courseData, error: courseError },
      ] = await Promise.all([
        supabase
          .from("batches")
          .select(`
            id,
            batch_code,
            batch_name,
            course_id,
            start_date,
            end_date,
            trainer_name,
            mentor_contact_number,
            max_students,
            status,
            created_at,
            courses (
              id,
              title,
              course_code
            )
          `)
          .order("start_date", { ascending: false }),

        supabase
          .from("courses")
          .select("id, title, course_code, is_active")
          .eq("is_active", true)
          .order("title", { ascending: true }),
      ]);

      if (batchError) throw batchError;
      if (courseError) throw courseError;

      setBatches(batchData || []);
      setCourses(courseData || []);
    } catch (err) {
      console.error("Batch loading error:", err);
      setError(err.message || "Unable to load batches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SEARCH AND FILTER
  const filteredBatches = batches.filter((batch) => {
    const query = search.toLowerCase();

    const matchesSearch =
      batch.batch_name?.toLowerCase().includes(query) ||
      batch.batch_code?.toLowerCase().includes(query) ||
      batch.trainer_name?.toLowerCase().includes(query) ||
      batch.mentor_contact_number?.toLowerCase().includes(query) ||
      batch.courses?.title?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || batch.status === statusFilter;

    const matchesCourse =
      courseFilter === "all" || batch.course_id === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  // OPEN ADD MODAL
  const openAddModal = () => {
    setEditingBatch(null);
    setForm({ ...initialForm });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (batch) => {
    setEditingBatch(batch);

    setForm({
      batch_code: batch.batch_code || "",
      batch_name: batch.batch_name || "",
      course_id: batch.course_id || "",
      start_date: batch.start_date || "",
      end_date: batch.end_date || "",
      trainer_name: batch.trainer_name || "",
      mentor_contact_number: batch.mentor_contact_number || "",
      max_students: String(batch.max_students ?? 30),
      status: batch.status || "upcoming",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // CLOSE MODAL
  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingBatch(null);
    setForm({ ...initialForm });
    setError("");
  };

  // FORM INPUT HANDLER
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // SAVE BATCH
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.batch_code.trim() ||
      !form.batch_name.trim() ||
      !form.course_id ||
      !form.start_date ||
      !form.end_date
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.end_date < form.start_date) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    const maxStudents = Number(form.max_students);

    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      setError("Maximum students must be a whole number greater than zero.");
      return;
    }

    const phone = form.mentor_contact_number.trim();

    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      setError("Please enter a valid mentor contact number.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        batch_code: form.batch_code.trim().toUpperCase(),
        batch_name: form.batch_name.trim(),
        course_id: form.course_id,
        start_date: form.start_date,
        end_date: form.end_date,
        trainer_name: form.trainer_name.trim() || null,
        mentor_contact_number: phone || null,
        max_students: maxStudents,
        status: form.status,
      };

      if (editingBatch) {
        const { error } = await supabase
          .from("batches")
          .update(payload)
          .eq("id", editingBatch.id);

        if (error) throw error;

        setSuccess("Batch updated successfully.");
      } else {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        const { error } = await supabase
          .from("batches")
          .insert({
            ...payload,
            created_by: user?.id,
          });

        if (error) throw error;

        setSuccess("Batch created successfully.");
      }

      setModalOpen(false);
      setEditingBatch(null);
      setForm({ ...initialForm });

      await fetchData();
    } catch (err) {
      console.error("Batch save error:", err);

      if (err.code === "23505") {
        setError("This batch code already exists. Please use another code.");
      } else {
        setError(err.message || "Unable to save batch.");
      }
    } finally {
      setSaving(false);
    }
  };

  // UPDATE BATCH STATUS
  const updateBatchStatus = async (batch, nextStatus) => {
    if (batch.status === nextStatus) return;

    const confirmed = window.confirm(
      `Change "${batch.batch_name}" status to ${nextStatus}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("batches")
        .update({ status: nextStatus })
        .eq("id", batch.id);

      if (error) throw error;

      setSuccess("Batch status updated successfully.");
      await fetchData();
    } catch (err) {
      console.error("Batch status update error:", err);
      setError(err.message || "Unable to update batch status.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusLabel = (status) =>
    status?.charAt(0).toUpperCase() + status?.slice(1);

  const countByStatus = (status) =>
    batches.filter((batch) => batch.status === status).length;

  return (
    <div className="batches-page">
      {/* HEADER */}
      <div className="batches-header">
        <div>
          <span className="batches-eyebrow">ACADEMY MANAGEMENT</span>
          <h1>Batches</h1>
          <p>
            Create training batches and manage schedules, mentors and capacity.
          </p>
        </div>

        <button className="batch-add-button" onClick={openAddModal}>
          <Plus size={18} />
          Create Batch
        </button>
      </div>

      {/* ALERTS */}
      {error && !modalOpen && (
        <div className="batches-alert batches-alert-error">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="batches-alert batches-alert-success">
          {success}
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="batches-summary-grid">
        <div className="batch-summary-card">
          <div className="batch-summary-icon blue">
            <CalendarDays size={22} />
          </div>
          <div>
            <span>Total Batches</span>
            <h2>{loading ? "..." : batches.length}</h2>
          </div>
        </div>

        <div className="batch-summary-card">
          <div className="batch-summary-icon orange">
            <Clock size={22} />
          </div>
          <div>
            <span>Upcoming</span>
            <h2>{loading ? "..." : countByStatus("upcoming")}</h2>
          </div>
        </div>

        <div className="batch-summary-card">
          <div className="batch-summary-icon green">
            <Power size={22} />
          </div>
          <div>
            <span>Ongoing</span>
            <h2>{loading ? "..." : countByStatus("ongoing")}</h2>
          </div>
        </div>

        <div className="batch-summary-card">
          <div className="batch-summary-icon purple">
            <Users size={22} />
          </div>
          <div>
            <span>Completed</span>
            <h2>{loading ? "..." : countByStatus("completed")}</h2>
          </div>
        </div>
      </div>

      {/* BATCH TABLE */}
      <div className="batches-table-container">
        <div className="batches-table-header">
          <div>
            <h3>All Batches</h3>
            <p>View and manage scheduled training batches.</p>
          </div>

          <div className="batches-filters">
            <div className="batches-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search batches or mentors..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              aria-label="Filter by course"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>

            <button
              className="batches-refresh"
              onClick={fetchData}
              disabled={loading}
              title="Refresh batches"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="batches-table-scroll">
          <table className="batches-table">
            <thead>
              <tr>
                <th>BATCH</th>
                <th>COURSE</th>
                <th>SCHEDULE</th>
                <th>MENTOR</th>
                <th>CONTACT</th>
                <th>CAPACITY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="batches-empty">
                    Loading batches...
                  </td>
                </tr>
              ) : filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <div className="batch-name-cell">
                        <div className="batch-avatar">
                          <CalendarDays size={18} />
                        </div>
                        <div>
                          <strong>{batch.batch_name}</strong>
                          <span>{batch.batch_code}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="batch-course-cell">
                        <BookOpen size={15} />
                        {batch.courses?.title || "Course unavailable"}
                      </div>
                    </td>

                    <td>
                      <div className="batch-schedule-cell">
                        <strong>{formatDate(batch.start_date)}</strong>
                        <span>to {formatDate(batch.end_date)}</span>
                      </div>
                    </td>

                    <td>
                      <div className="batch-mentor-cell">
                        <User size={14} />
                        {batch.trainer_name || "Not assigned"}
                      </div>
                    </td>

                    <td>
                      {batch.mentor_contact_number ? (
                        <a
                          className="batch-mentor-phone"
                          href={`tel:${batch.mentor_contact_number.replace(
                            /[^\d+]/g,
                            ""
                          )}`}
                        >
                          <Phone size={14} />
                          {batch.mentor_contact_number}
                        </a>
                      ) : (
                        <span className="batch-not-assigned">
                          Not added
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="batch-capacity">
                        <Users size={14} />
                        {batch.max_students ?? "—"}
                      </span>
                    </td>

                    <td>
                      <span className={`batch-status ${batch.status}`}>
                        {statusLabel(batch.status)}
                      </span>
                    </td>

                    <td>
                      <div className="batch-row-actions">
                        <button
                          className="batch-edit-button"
                          onClick={() => openEditModal(batch)}
                          title="Edit batch"
                        >
                          <Pencil size={16} />
                        </button>

                        <select
                          className="batch-status-select"
                          value={batch.status}
                          onChange={(event) =>
                            updateBatchStatus(batch, event.target.value)
                          }
                          aria-label={`Change status for ${batch.batch_name}`}
                          title="Change status"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="batches-empty">
                    <div>
                      <CalendarDays size={38} />
                      <h3>
                        {search ||
                        statusFilter !== "all" ||
                        courseFilter !== "all"
                          ? "No matching batches found"
                          : "No batches created yet"}
                      </h3>
                      <p>
                        {search ||
                        statusFilter !== "all" ||
                        courseFilter !== "all"
                          ? "Try changing your search or filters."
                          : "Create your first batch to start scheduling training."}
                      </p>

                      {!search &&
                        statusFilter === "all" &&
                        courseFilter === "all" && (
                          <button onClick={openAddModal}>
                            <Plus size={16} />
                            Create First Batch
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="batches-table-footer">
          Showing {loading ? "..." : filteredBatches.length} of{" "}
          {batches.length} batches
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div
          className="batch-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="batch-modal">
            <div className="batch-modal-header">
              <div>
                <span>BATCH MANAGEMENT</span>
                <h2>{editingBatch ? "Edit Batch" : "Create New Batch"}</h2>
                <p>
                  Enter the training schedule, mentor and batch information.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="batch-form-grid">
                <label>
                  Batch Code *
                  <input
                    name="batch_code"
                    value={form.batch_code}
                    onChange={handleChange}
                    placeholder="e.g. WEB-OCT-26"
                    required
                  />
                </label>

                <label>
                  Batch Name *
                  <input
                    name="batch_name"
                    value={form.batch_name}
                    onChange={handleChange}
                    placeholder="e.g. Web Development October"
                    required
                  />
                </label>

                <label className="batch-full-field">
                  Course / Service *
                  <select
                    name="course_id"
                    value={form.course_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a course or service</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.course_code})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Start Date *
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  End Date *
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    min={form.start_date || undefined}
                    required
                  />
                </label>

                <label>
                  Mentor Name
                  <input
                    name="trainer_name"
                    value={form.trainer_name}
                    onChange={handleChange}
                    placeholder="Enter mentor name"
                  />
                </label>

                <label>
                  Mentor Contact Number
                  <input
                    type="tel"
                    name="mentor_contact_number"
                    value={form.mentor_contact_number}
                    onChange={handleChange}
                    placeholder="Enter mentor phone number"
                    maxLength={20}
                  />
                </label>

                <label>
                  Maximum Students *
                  <input
                    type="number"
                    name="max_students"
                    min="1"
                    step="1"
                    value={form.max_students}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="batch-full-field">
                  Batch Status *
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {courses.length === 0 && (
                <div className="batches-modal-error">
                  No active courses are available. Create or activate a course
                  before creating a batch.
                </div>
              )}

              {error && (
                <div className="batches-modal-error">{error}</div>
              )}

              <div className="batch-modal-actions">
                <button
                  type="button"
                  className="batch-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="batch-save-button"
                  disabled={saving || courses.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : editingBatch
                    ? "Save Changes"
                    : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}