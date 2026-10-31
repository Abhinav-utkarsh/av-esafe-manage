
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp, Search, RefreshCw, X, User, BookOpen,
  CalendarDays, Save, GraduationCap, CheckCircle, Eye,
  Pencil, Layers, Users, AlertTriangle
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./Progress.css";

const statuses = ["active", "on_hold", "completed"];

export default function Progress() {
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);

  const [viewMode, setViewMode] = useState("student");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState("active");
  const [batchNotes, setBatchNotes] = useState("");
  const [batchSaving, setBatchSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [progressValue, setProgressValue] = useState(0);
  const [progressNotes, setProgressNotes] = useState("");
  const [itemStatus, setItemStatus] = useState("active");

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [progressResult, batchResult] = await Promise.all([
        supabase
          .from("enrollment_items")
          .select(`
            id,
            enrollment_id,
            course_id,
            batch_id,
            course_title_snapshot,
            price_snapshot,
            progress_percentage,
            progress_notes,
            item_status,
            progress_updated_at,
            enrollments!inner (
              id,
              student_id,
              enrollment_status,
              enrollment_date,
              profiles:student_id (
                id,
                full_name,
                email
              )
            ),
            batches (
              id,
              batch_name,
              batch_code,
              status
            )
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("batches")
          .select("id, batch_name, batch_code, status, course_id")
          .eq("status", "ongoing")
          .order("batch_name")
      ]);

      if (progressResult.error) throw progressResult.error;
      if (batchResult.error) throw batchResult.error;

      setItems(progressResult.data || []);
      setBatches(batchResult.data || []);
    } catch (err) {
      console.error("Progress loading error:", err);
      setError(err.message || "Unable to load progress information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Group records by student.
  const groupedStudents = useMemo(() => {
    const groups = {};

    items.forEach((item) => {
      const student = item.enrollments?.profiles;
      const studentId = item.enrollments?.student_id;

      if (!studentId) return;

      if (!groups[studentId]) {
        groups[studentId] = {
          id: studentId,
          name: student?.full_name || "Student",
          email: student?.email || "",
          services: []
        };
      }

      groups[studentId].services.push(item);
    });

    return Object.values(groups).map((student) => {
      const total = student.services.length;
      const average = total
        ? Math.round(
            student.services.reduce(
              (sum, item) => sum + Number(item.progress_percentage || 0),
              0
            ) / total
          )
        : 0;

      const completed = student.services.filter(
        (item) => item.item_status === "completed"
      ).length;

      const active = student.services.filter(
        (item) => item.item_status === "active"
      ).length;

      const onHold = student.services.filter(
        (item) => item.item_status === "on_hold"
      ).length;

      const latestUpdate = student.services
        .map((item) => item.progress_updated_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];

      return {
        ...student,
        total,
        average,
        completed,
        active,
        onHold,
        latestUpdate
      };
    });
  }, [items]);

  // Always derive the selected student from the latest records.
  const currentSelectedStudent = useMemo(() => {
    if (!selectedStudent) return null;

    return groupedStudents.find(
      (student) => student.id === selectedStudent.id
    ) || null;
  }, [selectedStudent, groupedStudents]);

  const filteredStudents = useMemo(() => {
    return groupedStudents.filter((student) => {
      const query = search.toLowerCase();

      const matchesSearch =
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.services.some((item) =>
          item.course_title_snapshot?.toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "all" ||
        student.services.some(
          (item) => item.item_status === statusFilter
        );

      return matchesSearch && matchesStatus;
    });
  }, [groupedStudents, search, statusFilter]);

  // Selected batch and all its enrollment items.
  const selectedBatch = batches.find(
    (batch) => batch.id === selectedBatchId
  );

  const selectedBatchItems = useMemo(
    () => items.filter((item) => item.batch_id === selectedBatchId),
    [items, selectedBatchId]
  );

  const batchStudents = useMemo(() => {
    const unique = new Map();

    selectedBatchItems.forEach((item) => {
      const studentId = item.enrollments?.student_id;
      const profile = item.enrollments?.profiles;

      if (studentId && !unique.has(studentId)) {
        unique.set(studentId, {
          id: studentId,
          name: profile?.full_name || "Student",
          email: profile?.email || ""
        });
      }
    });

    return Array.from(unique.values());
  }, [selectedBatchItems]);

  const averageProgress = items.length
    ? Math.round(
        items.reduce(
          (sum, item) => sum + Number(item.progress_percentage || 0),
          0
        ) / items.length
      )
    : 0;

  const completedCount = items.filter(
    (item) => item.item_status === "completed"
  ).length;

  const activeCount = items.filter(
    (item) => item.item_status === "active"
  ).length;

  const openStudent = (student) => {
    setSelectedStudent({ id: student.id });
    setError("");
    setSuccess("");
  };

  const closeStudent = () => {
    if (savingId || editingItem) return;
    setSelectedStudent(null);
    setError("");
  };

  const openEditor = (item) => {
    setEditingItem(item);
    setProgressValue(Number(item.progress_percentage || 0));
    setProgressNotes(item.progress_notes || "");
    setItemStatus(item.item_status || "active");
    setError("");
  };

  const closeEditor = () => {
    if (savingId) return;

    setEditingItem(null);
    setProgressValue(0);
    setProgressNotes("");
    setItemStatus("active");
    setError("");
  };

  const handleProgressChange = (event) => {
    const value = Math.max(
      0,
      Math.min(100, Number(event.target.value) || 0)
    );

    setProgressValue(value);

    if (value === 100) {
      setItemStatus("completed");
    } else if (itemStatus === "completed") {
      setItemStatus("active");
    }
  };

  const saveProgress = async (event) => {
    event.preventDefault();

    if (!editingItem) return;

    if (!Number.isInteger(progressValue) || progressValue < 0 || progressValue > 100) {
      setError("Progress must be a whole number between 0 and 100.");
      return;
    }

    if (progressValue === 100 && itemStatus !== "completed") {
      setError("A course with 100% progress must be marked Completed.");
      return;
    }

    if (progressValue < 100 && itemStatus === "completed") {
      setError("Set progress to 100% before marking Completed.");
      return;
    }

    const editingId = editingItem.id;
    setSavingId(editingId);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase
        .from("enrollment_items")
        .update({
          progress_percentage: progressValue,
          progress_notes: progressNotes.trim() || null,
          item_status: itemStatus
        })
        .eq("id", editingId)
        .select("id");

      if (error) throw error;
      if (!data?.length) {
        throw new Error("Progress was not updated. Check your admin permissions.");
      }

      setEditingItem(null);
      setProgressValue(0);
      setProgressNotes("");
      setItemStatus("active");

      await fetchProgress();
      setSuccess("Student progress updated successfully.");
    } catch (err) {
      console.error("Progress update error:", err);
      setError(err.message || "Unable to update student progress.");
    } finally {
      setSavingId(null);
    }
  };

  // Batch-wise update: replace progress for every enrollment item
  // assigned to the selected ongoing batch.
  const saveBatchProgress = async (event) => {
    event.preventDefault();

    if (!selectedBatchId || !selectedBatch) {
      setError("Please select an ongoing batch.");
      return;
    }

    if (selectedBatch.status !== "ongoing") {
      setError("Only ongoing batches can be updated.");
      return;
    }

    if (!selectedBatchItems.length) {
      setError("There are no enrolled students assigned to this batch.");
      return;
    }

    if (!Number.isInteger(batchProgress) || batchProgress < 0 || batchProgress > 100) {
      setError("Progress must be a whole number between 0 and 100.");
      return;
    }

    if (batchProgress === 100 && batchStatus !== "completed") {
      setError("A 100% batch update must use Completed status.");
      return;
    }

    if (batchProgress < 100 && batchStatus === "completed") {
      setError("Use 100% progress before marking the batch Completed.");
      return;
    }

    const confirmed = window.confirm(
      `You are about to replace progress for ${batchStudents.length} student(s) across ${selectedBatchItems.length} enrollment record(s) in "${selectedBatch.batch_name}".\n\nEvery selected record will be set to ${batchProgress}% with status "${batchStatus.replace("_", " ")}".\n\nThis will overwrite their existing individual progress and notes. Continue?`
    );

    if (!confirmed) return;

    setBatchSaving(true);
    setError("");
    setSuccess("");

    try {
      const itemIds = selectedBatchItems.map((item) => item.id);

      const { data, error } = await supabase
        .from("enrollment_items")
        .update({
          progress_percentage: batchProgress,
          item_status: batchStatus,
          progress_notes: batchNotes.trim() || null
        })
        .in("id", itemIds)
        .select("id");

      if (error) throw error;

      if (!data || data.length !== itemIds.length) {
        throw new Error(
          `Only ${data?.length || 0} of ${itemIds.length} records were updated. Please refresh and check the batch before retrying.`
        );
      }

      await fetchProgress();

      setSuccess(
        `Batch progress updated successfully for ${batchStudents.length} student(s).`
      );
      setBatchNotes("");
    } catch (err) {
      console.error("Batch progress update error:", err);
      setError(err.message || "Unable to update batch progress.");
    } finally {
      setBatchSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not updated";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Not updated";

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const statusLabel = (status) => {
    if (status === "on_hold") return "On Hold";
    return status?.charAt(0).toUpperCase() + status?.slice(1);
  };

  const getStatusSummary = (student) => {
    if (student.completed === student.total) return "Completed";
    if (student.onHold === student.total) return "On Hold";
    return "Active";
  };

  return (
    <div className="progress-page">
      <div className="progress-header">
        <div>
          <span className="progress-eyebrow">ACADEMY MANAGEMENT</span>
          <h1>Student Progress</h1>
          <p>Manage learning progress student by student or batch by batch.</p>
        </div>

        <button
          className="progress-refresh-button"
          onClick={fetchProgress}
          disabled={loading || batchSaving}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && !editingItem && (
        <div className="progress-alert error">
          {error}
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="progress-alert success">
          {success}
          <button onClick={() => setSuccess("")}><X size={16} /></button>
        </div>
      )}

      <div className="progress-summary-grid">
        <div className="progress-summary-card">
          <div className="progress-summary-icon blue"><User size={22} /></div>
          <div><span>Total Students</span><h2>{loading ? "..." : groupedStudents.length}</h2></div>
        </div>

        <div className="progress-summary-card">
          <div className="progress-summary-icon green"><TrendingUp size={22} /></div>
          <div><span>Average Progress</span><h2>{loading ? "..." : `${averageProgress}%`}</h2></div>
        </div>

        <div className="progress-summary-card">
          <div className="progress-summary-icon purple"><CheckCircle size={22} /></div>
          <div><span>Completed Services</span><h2>{loading ? "..." : completedCount}</h2></div>
        </div>

        <div className="progress-summary-card">
          <div className="progress-summary-icon orange"><GraduationCap size={22} /></div>
          <div><span>Active Services</span><h2>{loading ? "..." : activeCount}</h2></div>
        </div>
      </div>

      {/* VIEW SWITCHER */}
      <div className="progress-view-switcher">
        <button
          className={viewMode === "student" ? "active" : ""}
          onClick={() => setViewMode("student")}
        >
          <User size={17} />
          Student-wise
        </button>

        <button
          className={viewMode === "batch" ? "active" : ""}
          onClick={() => setViewMode("batch")}
        >
          <Layers size={17} />
          Batch-wise
        </button>
      </div>

      {/* STUDENT-WISE VIEW */}
      {viewMode === "student" && (
        <div className="progress-table-container">
          <div className="progress-table-header">
            <div>
              <h3>Student Progress Overview</h3>
              <p>Each student appears once. Open their profile to manage individual services.</p>
            </div>

            <div className="progress-filters">
              <div className="progress-search">
                <Search size={17} />
                <input
                  placeholder="Search student or course..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter progress status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="progress-table-scroll">
            <table className="progress-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>ENROLLED SERVICES</th>
                  <th>OVERALL PROGRESS</th>
                  <th>STATUS</th>
                  <th>LAST UPDATED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="progress-empty">Loading student progress...</td></tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="progress-student-cell">
                          <div className="progress-student-avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{student.name}</strong>
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="progress-course-cell">
                          <strong>{student.total} Services</strong>
                          <span>{student.completed} Completed · {student.active} Active</span>
                        </div>
                      </td>

                      <td>
                        <div className="progress-value-cell">
                          <div className="progress-bar">
                            <div style={{ width: `${student.average}%` }} />
                          </div>
                          <strong>{student.average}%</strong>
                        </div>
                      </td>

                      <td>
                        <span className={`progress-status ${
                          student.onHold === student.total
                            ? "on_hold"
                            : student.completed === student.total
                            ? "completed"
                            : "active"
                        }`}>
                          {getStatusSummary(student)}
                        </span>
                      </td>

                      <td>
                        <span className="progress-updated-date">
                          {formatDate(student.latestUpdate)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="progress-edit-button"
                          onClick={() => openStudent(student)}
                        >
                          <Eye size={15} />
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="progress-empty">
                      <div>
                        <GraduationCap size={38} />
                        <h3>{search || statusFilter !== "all" ? "No matching students found" : "No enrolled services yet"}</h3>
                        <p>{search || statusFilter !== "all" ? "Try changing your search or filters." : "Progress records will appear after students are enrolled."}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="progress-table-footer">
            Showing {loading ? "..." : filteredStudents.length} of {groupedStudents.length} students
          </div>
        </div>
      )}

      {/* BATCH-WISE VIEW */}
      {viewMode === "batch" && (
        <div className="progress-table-container batch-progress-container">
          <div className="progress-table-header">
            <div>
              <h3>Batch-wise Progress Management</h3>
              <p>Apply the same progress update to every student assigned to an ongoing batch.</p>
            </div>
          </div>

          <div className="batch-progress-content">
            <div className="batch-progress-selector">
              <label htmlFor="progress-batch-select">Select Ongoing Batch</label>
              <select
                id="progress-batch-select"
                value={selectedBatchId}
                onChange={(event) => {
                  setSelectedBatchId(event.target.value);
                  setBatchProgress(0);
                  setBatchStatus("active");
                  setBatchNotes("");
                  setError("");
                }}
              >
                <option value="">Choose an ongoing batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_name} {batch.batch_code ? `(${batch.batch_code})` : ""}
                  </option>
                ))}
              </select>
              {batches.length === 0 && (
                <p>No ongoing batches are available. Create or activate a batch first.</p>
              )}
            </div>

            {selectedBatch && (
              <>
                <div className="batch-progress-info-grid">
                  <div>
                    <Users size={20} />
                    <span>Students in batch</span>
                    <strong>{batchStudents.length}</strong>
                  </div>
                  <div>
                    <BookOpen size={20} />
                    <span>Progress records</span>
                    <strong>{selectedBatchItems.length}</strong>
                  </div>
                  <div>
                    <TrendingUp size={20} />
                    <span>Current average</span>
                    <strong>
                      {selectedBatchItems.length
                        ? Math.round(
                            selectedBatchItems.reduce(
                              (sum, item) => sum + Number(item.progress_percentage || 0),
                              0
                            ) / selectedBatchItems.length
                          )
                        : 0}%
                    </strong>
                  </div>
                </div>

                <div className="batch-progress-students">
                  <h4>Students assigned to this batch</h4>

                  {batchStudents.length ? (
                    <div className="batch-student-list">
                      {batchStudents.map((student) => (
                        <div className="batch-student-row" key={student.id}>
                          <div className="progress-student-avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{student.name}</strong>
                            <span>{student.email}</span>
                          </div>
                          <CheckCircle size={17} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="batch-no-students">
                      No students are currently assigned to this batch.
                    </p>
                  )}
                </div>

                <form className="batch-progress-form" onSubmit={saveBatchProgress}>
                  <div className="batch-progress-form-heading">
                    <div>
                      <h4>Update Entire Batch</h4>
                      <p>This will replace existing progress for all listed records.</p>
                    </div>
                    <Layers size={22} />
                  </div>

                  <div className="batch-progress-range-card">
                    <div className="progress-editor-label">
                      <span>Common Completion Progress</span>
                      <strong>{batchProgress}%</strong>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={batchProgress}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setBatchProgress(value);

                        if (value === 100) {
                          setBatchStatus("completed");
                        } else if (batchStatus === "completed") {
                          setBatchStatus("active");
                        }
                      }}
                      className="progress-range"
                    />

                    <div className="progress-range-labels">
                      <span>0% — Not Started</span>
                      <span>100% — Completed</span>
                    </div>
                  </div>

                  <div className="batch-progress-form-grid">
                    <label>
                      Common Service Status
                      <select
                        value={batchStatus}
                        onChange={(event) => setBatchStatus(event.target.value)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Common Progress Notes
                      <textarea
                        rows="3"
                        value={batchNotes}
                        onChange={(event) => setBatchNotes(event.target.value)}
                        placeholder="Example: Completed HTML and CSS fundamentals..."
                      />
                    </label>
                  </div>

                  <div className="batch-progress-warning">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Important: This overwrites individual progress.</strong>
                      <p>
                        {batchStudents.length} student(s) and {selectedBatchItems.length} progress record(s)
                        will receive the same percentage, status and notes. Their previous progress and
                        notes will be replaced.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="batch-progress-save-button"
                    disabled={batchSaving || loading || selectedBatchItems.length === 0}
                  >
                    <Save size={17} />
                    {batchSaving ? "Updating Batch..." : `Apply to ${batchStudents.length} Students`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* STUDENT DETAILS POPUP */}
      {currentSelectedStudent && (
        <div
          className="student-progress-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeStudent();
          }}
        >
          <div className="student-progress-modal">
            <div className="student-progress-header">
              <div>
                <span>STUDENT PROFILE</span>
                <h2>{currentSelectedStudent.name}</h2>
                <p>{currentSelectedStudent.email}</p>
              </div>
              <button onClick={closeStudent} aria-label="Close">
                <X size={21} />
              </button>
            </div>

            <div className="student-progress-summary">
              <div>
                <span>Services</span>
                <strong>{currentSelectedStudent.services.length}</strong>
              </div>
              <div>
                <span>Average Progress</span>
                <strong>{currentSelectedStudent.average}%</strong>
              </div>
              <div>
                <span>Completed</span>
                <strong>{currentSelectedStudent.completed}</strong>
              </div>
            </div>

            <div className="student-progress-content">
              <div className="student-progress-section-heading">
                <div>
                  <h3>Enrolled Courses & Services</h3>
                  <p>Manage progress separately for each service.</p>
                </div>
                <BookOpen size={21} />
              </div>

              <div className="student-service-list">
                {currentSelectedStudent.services.map((item) => {
                  const percentage = Number(item.progress_percentage || 0);

                  return (
                    <div className="student-service-card" key={item.id}>
                      <div className="student-service-top">
                        <div>
                          <h4>{item.course_title_snapshot}</h4>
                          <span>₹{Number(item.price_snapshot || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <span className={`progress-status ${item.item_status}`}>
                          {statusLabel(item.item_status)}
                        </span>
                      </div>

                      <div className="student-service-batch">
                        <CalendarDays size={15} />
                        {item.batches?.batch_name || "No batch assigned"}
                      </div>

                      <div className="student-service-progress">
                        <div className="student-service-progress-label">
                          <span>Completion</span>
                          <strong>{percentage}%</strong>
                        </div>
                        <div className="progress-bar student-service-bar">
                          <div style={{ width: `${percentage}%` }} />
                        </div>
                      </div>

                      {item.progress_notes && (
                        <div className="student-service-notes">
                          <strong>Admin Notes</strong>
                          <p>{item.progress_notes}</p>
                        </div>
                      )}

                      <div className="student-service-footer">
                        <span>Updated: {formatDate(item.progress_updated_at)}</span>
                        <button
                          className="progress-edit-button"
                          onClick={() => openEditor(item)}
                        >
                          <Pencil size={14} />
                          Update Progress
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="student-progress-modal-footer">
              <button onClick={closeStudent}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL COURSE EDITOR */}
      {editingItem && (
        <div
          className="progress-modal-overlay progress-editor-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <div className="progress-modal">
            <div className="progress-modal-header">
              <div>
                <span>PROGRESS MANAGEMENT</span>
                <h2>Update Student Progress</h2>
                <p>
                  {editingItem.enrollments?.profiles?.full_name || "Student"}
                  {" — "}
                  {editingItem.course_title_snapshot}
                </p>
              </div>
              <button
                onClick={closeEditor}
                disabled={Boolean(savingId)}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveProgress}>
              <div className="progress-editor-card">
                <div className="progress-editor-label">
                  <span>Completion Progress</span>
                  <strong>{progressValue}%</strong>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={progressValue}
                  onChange={handleProgressChange}
                  className="progress-range"
                />

                <div className="progress-range-labels">
                  <span>0% — Not Started</span>
                  <span>100% — Completed</span>
                </div>
              </div>

              <label className="progress-modal-label">
                Service Status
                <select
                  value={itemStatus}
                  onChange={(event) => setItemStatus(event.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="progress-modal-label">
                Progress Notes
                <textarea
                  rows="4"
                  value={progressNotes}
                  onChange={(event) => setProgressNotes(event.target.value)}
                  placeholder="Add topics completed, assessments, feedback or next steps..."
                />
              </label>

              <div className="progress-modal-info">
                <User size={16} />
                Only Admin can update this information. Students can view their progress from their dashboard.
              </div>

              {error && <div className="progress-modal-error">{error}</div>}

              <div className="progress-modal-actions">
                <button
                  type="button"
                  className="progress-cancel-button"
                  onClick={closeEditor}
                  disabled={Boolean(savingId)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="progress-save-button"
                  disabled={Boolean(savingId)}
                >
                  <Save size={16} />
                  {savingId ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
