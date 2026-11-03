
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./Assessments.css";

const INITIAL_FORM = {
  student_id: "",
  course_id: "",
  assessment_name: "",
  assessment_type: "Technical Test",
  assessment_date: new Date().toISOString().slice(0, 10),
  marks_obtained: "",
  maximum_marks: "100",
  passing_marks: "",
  feedback: "",
};

const ASSESSMENT_TYPES = [
  "Technical Test",
  "Aptitude Test",
  "Assignment",
  "Interview",
  "Other",
];

export default function Assessments() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [searchStudent, setSearchStudent] = useState("");
  const [showStudentOptions, setShowStudentOptions] = useState(false);

  const [searchResult, setSearchResult] = useState("");
  const [filterType, setFilterType] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, courseResponse, resultResponse] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "student")
            .eq("account_status", "active")
            .order("full_name"),

          supabase
            .from("courses")
            .select("id, title")
            .eq("is_active", true)
            .order("title"),

          supabase
            .from("student_assessment_results")
            .select(`
              *,
              student:profiles!student_assessment_results_student_id_fkey (
                full_name,
                email
              ),
              course:courses (
                title
              )
            `)
            .order("assessment_date", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

      if (studentResponse.error) throw studentResponse.error;
      if (courseResponse.error) throw courseResponse.error;
      if (resultResponse.error) throw resultResponse.error;

      const fetchedResults = resultResponse.data || [];

      // Evaluator name is stored as a snapshot on each assessment result.
      const resultsWithEvaluators = fetchedResults.map((result) => ({
        ...result,
        evaluator_name: result.evaluator_name || "Unknown",
      }));

      setStudents(studentResponse.data || []);
      setCourses(courseResponse.data || []);
      setResults(resultsWithEvaluators);
    } catch (err) {
      setError(err.message || "Unable to load assessment data.");
    } finally {
      setLoading(false);
    }
  }

  // Automatic percentage calculation.
  const percentage = useMemo(() => {
    const obtained = Number(form.marks_obtained);
    const maximum = Number(form.maximum_marks);

    if (
      form.marks_obtained === "" ||
      form.maximum_marks === "" ||
      !Number.isFinite(obtained) ||
      !Number.isFinite(maximum) ||
      maximum <= 0 ||
      obtained < 0 ||
      obtained > maximum
    ) {
      return null;
    }

    return ((obtained / maximum) * 100).toFixed(2);
  }, [form.marks_obtained, form.maximum_marks]);

  // Pass / Fail calculation.
  const resultStatus = useMemo(() => {
    if (percentage === null || form.passing_marks === "") {
      return null;
    }

    const obtained = Number(form.marks_obtained);
    const passing = Number(form.passing_marks);

    if (
      !Number.isFinite(passing) ||
      passing < 0 ||
      passing > Number(form.maximum_marks)
    ) {
      return null;
    }

    return obtained >= passing ? "PASS" : "FAIL";
  }, [
    percentage,
    form.marks_obtained,
    form.passing_marks,
    form.maximum_marks,
  ]);

  // Search students by name or email.
  const filteredStudents = students.filter((student) => {
    const query = searchStudent.trim().toLowerCase();

    if (!query) return true;

    return (
      student.full_name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    );
  });

  // Search and filter assessment results.
  const filteredResults = results.filter((result) => {
    const query = searchResult.toLowerCase();

    const matchesSearch =
      result.assessment_name?.toLowerCase().includes(query) ||
      result.student?.full_name?.toLowerCase().includes(query) ||
      result.student?.email?.toLowerCase().includes(query) ||
      result.evaluator_name?.toLowerCase().includes(query);

    const matchesType =
      filterType === "All" ||
      result.assessment_type === filterType;

    return matchesSearch && matchesType;
  });

  function updateField(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Open a new result form.
  function openAddForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setSearchStudent("");
    setShowStudentOptions(false);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  // Open an existing result for editing.
  function openEditForm(result) {
    setEditingId(result.id);

    setForm({
      student_id: result.student_id,
      course_id: result.course_id || "",
      assessment_name: result.assessment_name,
      assessment_type: result.assessment_type,
      assessment_date: result.assessment_date,
      marks_obtained: String(result.marks_obtained),
      maximum_marks: String(result.maximum_marks),
      passing_marks:
        result.passing_marks === null
          ? ""
          : String(result.passing_marks),
      feedback: result.feedback || "",
    });

    setSearchStudent(
      result.student?.full_name
        ? `${result.student.full_name} (${result.student.email || ""})`
        : ""
    );

    setShowStudentOptions(false);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  // Select a student from the dropdown.
  function selectStudent(student) {
    setForm((previous) => ({
      ...previous,
      student_id: student.id,
    }));

    setSearchStudent(
      `${student.full_name} (${student.email})`
    );

    setShowStudentOptions(false);
  }

  // Submit or update assessment result.
  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.student_id) {
      setError("Please select a student.");
      return;
    }

    if (!form.assessment_name.trim()) {
      setError("Please enter an assessment name.");
      return;
    }

    const obtained = Number(form.marks_obtained);
    const maximum = Number(form.maximum_marks);

    const passing =
      form.passing_marks === ""
        ? null
        : Number(form.passing_marks);

    if (
      !Number.isFinite(obtained) ||
      !Number.isFinite(maximum) ||
      maximum <= 0 ||
      obtained < 0 ||
      obtained > maximum
    ) {
      setError("Please enter valid marks.");
      return;
    }

    if (
      passing !== null &&
      (!Number.isFinite(passing) ||
        passing < 0 ||
        passing > maximum)
    ) {
      setError(
        "Passing marks must be between 0 and maximum marks."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // Read the current evaluator's own profile name.
      const { data: evaluatorProfile, error: evaluatorProfileError } =
        await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

      if (evaluatorProfileError) throw evaluatorProfileError;

      const payload = {
        student_id: form.student_id,
        course_id: form.course_id || null,
        assessment_name: form.assessment_name.trim(),
        assessment_type: form.assessment_type,
        assessment_date: form.assessment_date,
        marks_obtained: obtained,
        maximum_marks: maximum,
        passing_marks: passing,
        feedback: form.feedback.trim() || null,
        created_by: user.id,
        evaluator_name: evaluatorProfile.full_name || user.email || "Academy Team",
      };

      let response;

      if (editingId) {
        // Preserve the original evaluator when editing.
        const { created_by, evaluator_name, ...updatePayload } = payload;

        response = await supabase
          .from("student_assessment_results")
          .update(updatePayload)
          .eq("id", editingId);
      } else {
        // Capture the currently logged-in evaluator.
        response = await supabase
          .from("student_assessment_results")
          .insert([payload]);
      }

      if (response.error) throw response.error;

      setShowForm(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      setSearchStudent("");
      setShowStudentOptions(false);

      setMessage(
        editingId
          ? "Assessment result updated successfully."
          : "Assessment result added successfully."
      );

      await fetchData();
    } catch (err) {
      setError(
        err.message || "Unable to save assessment result."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete assessment result.
  async function handleDelete(result) {
    const confirmed = window.confirm(
      `Delete "${result.assessment_name}" result for ${result.student?.full_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const { error: deleteError } = await supabase
        .from("student_assessment_results")
        .delete()
        .eq("id", result.id);

      if (deleteError) throw deleteError;

      setResults((previous) =>
        previous.filter((item) => item.id !== result.id)
      );

      setMessage("Assessment result deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete result.");
    }
  }

  // Close result form.
  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setSearchStudent("");
    setShowStudentOptions(false);
    setError("");
  }

  return (
    <div className="assessments-page">

      {/* Page Header */}
      <div className="assessments-header">
        <div>
          <div className="assessments-heading">
            <ClipboardCheck size={26} />
            <h1>Assessments & Results</h1>
          </div>

          <p>
            Manage student tests, assessments, interviews and results.
          </p>
        </div>

        <button
          className="assessment-primary-btn"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Result
        </button>
      </div>

      {/* Success Message */}
      {message && (
        <div className="assessment-alert success">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && !showForm && (
        <div className="assessment-alert error">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="assessment-summary">
        <div className="assessment-summary-card">
          <span>Total Results</span>
          <strong>{results.length}</strong>
        </div>

        <div className="assessment-summary-card">
          <span>Students Evaluated</span>
          <strong>
            {new Set(results.map((result) => result.student_id)).size}
          </strong>
        </div>

        <div className="assessment-summary-card">
          <span>Assessment Types</span>
          <strong>
            {new Set(results.map((result) => result.assessment_type)).size}
          </strong>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="assessment-toolbar">
        <div className="assessment-search">
          <Search size={18} />

          <input
            value={searchResult}
            onChange={(e) => setSearchResult(e.target.value)}
            placeholder="Search student, evaluator or assessment..."
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Types</option>

          {ASSESSMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Results Table */}
      <div className="assessment-table-container">
        {loading ? (
          <div className="assessment-loading">
            <LoaderCircle
              className="assessment-spin"
              size={28}
            />
            Loading assessment results...
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="assessment-empty">
            <ClipboardCheck size={42} />
            <h3>No assessment results found</h3>
            <p>Add your first student assessment result.</p>
          </div>
        ) : (
          <div className="assessment-table-scroll">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assessment</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Evaluated By</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map((result) => {
                  const passed =
                    result.passing_marks !== null &&
                    Number(result.marks_obtained) >=
                      Number(result.passing_marks);

                  return (
                    <tr key={result.id}>
                      <td>
                        <strong>
                          {result.student?.full_name || "Unknown"}
                        </strong>
                        <small>{result.student?.email}</small>
                      </td>

                      <td>
                        <strong>{result.assessment_name}</strong>
                        <small>
                          {result.course?.title || "General"}
                        </small>
                      </td>

                      <td>{result.assessment_type}</td>

                      <td>{result.assessment_date}</td>

                      <td>
                        {result.marks_obtained}/
                        {result.maximum_marks}
                      </td>

                      <td>
                        <strong>{result.percentage}%</strong>
                      </td>

                      <td>
                        {result.passing_marks === null ? (
                          <span className="assessment-neutral">
                            Not set
                          </span>
                        ) : passed ? (
                          <span className="assessment-status passed">
                            <CheckCircle2 size={14} />
                            Pass
                          </span>
                        ) : (
                          <span className="assessment-status failed">
                            <XCircle size={14} />
                            Fail
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="assessment-evaluator">
                          <UserCheck size={15} />
                          <strong>
                            {result.evaluator_name || "Unknown"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div className="assessment-actions">
                          <button
                            title="Edit result"
                            onClick={() => openEditForm(result)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            title="Delete result"
                            className="delete"
                            onClick={() => handleDelete(result)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Result Modal */}
      {showForm && (
        <div
          className="assessment-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="assessment-modal">

            {/* Modal Header */}
            <div className="assessment-modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Result"
                    : "Add Assessment Result"}
                </h2>

                <p>
                  Enter the student's assessment details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={21} />
              </button>
            </div>

            {error && (
              <div className="assessment-alert error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="assessment-form-grid">

                {/* Student Selection */}
                <div className="assessment-field full-width">
                  <label>Search Student *</label>

                  <input
                    value={searchStudent}
                    onFocus={() => setShowStudentOptions(true)}
                    onChange={(e) => {
                      setSearchStudent(e.target.value);
                      setShowStudentOptions(true);

                      setForm((previous) => ({
                        ...previous,
                        student_id: "",
                      }));
                    }}
                    placeholder="Click to select or search student..."
                    autoComplete="off"
                    required={!form.student_id}
                  />

                  {showStudentOptions && !form.student_id && (
                    <div className="assessment-student-options">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <button
                            type="button"
                            key={student.id}
                            onClick={() => selectStudent(student)}
                          >
                            <strong>{student.full_name}</strong>
                            <small>{student.email}</small>
                          </button>
                        ))
                      ) : (
                        <p>No matching students found.</p>
                      )}
                    </div>
                  )}

                  {form.student_id && (
                    <small className="assessment-selected">
                      <CheckCircle2 size={14} />
                      Student selected
                    </small>
                  )}
                </div>

                {/* Assessment Name */}
                <div className="assessment-field full-width">
                  <label>Assessment Name *</label>

                  <input
                    name="assessment_name"
                    value={form.assessment_name}
                    onChange={updateField}
                    placeholder="e.g. Java Programming Test"
                    maxLength={200}
                    required
                  />
                </div>

                {/* Assessment Type */}
                <div className="assessment-field">
                  <label>Assessment Type *</label>

                  <select
                    name="assessment_type"
                    value={form.assessment_type}
                    onChange={updateField}
                    required
                  >
                    {ASSESSMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course */}
                <div className="assessment-field">
                  <label>Course (Optional)</label>

                  <select
                    name="course_id"
                    value={form.course_id}
                    onChange={updateField}
                  >
                    <option value="">General Assessment</option>

                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assessment Date */}
                <div className="assessment-field full-width">
                  <label>Assessment Date *</label>

                  <input
                    type="date"
                    name="assessment_date"
                    value={form.assessment_date}
                    onChange={updateField}
                    required
                  />
                </div>

                {/* Marks Obtained */}
                <div className="assessment-field">
                  <label>Marks Obtained *</label>

                  <input
                    type="number"
                    name="marks_obtained"
                    min="0"
                    step="0.01"
                    value={form.marks_obtained}
                    onChange={updateField}
                    placeholder="e.g. 85"
                    required
                  />
                </div>

                {/* Maximum Marks */}
                <div className="assessment-field">
                  <label>Maximum Marks *</label>

                  <input
                    type="number"
                    name="maximum_marks"
                    min="0.01"
                    step="0.01"
                    value={form.maximum_marks}
                    onChange={updateField}
                    required
                  />
                </div>

                {/* Passing Marks */}
                <div className="assessment-field full-width">
                  <label>Passing Marks (Optional)</label>

                  <input
                    type="number"
                    name="passing_marks"
                    min="0"
                    step="0.01"
                    value={form.passing_marks}
                    onChange={updateField}
                    placeholder="Enter passing marks"
                  />
                </div>

                {/* Percentage Preview */}
                {percentage !== null && (
                  <div className="assessment-preview full-width">
                    <div>
                      <span>Calculated Percentage</span>
                      <strong>{percentage}%</strong>
                    </div>

                    {resultStatus && (
                      <span
                        className={
                          resultStatus === "PASS"
                            ? "assessment-status passed"
                            : "assessment-status failed"
                        }
                      >
                        {resultStatus}
                      </span>
                    )}
                  </div>
                )}

                {/* Mentor Feedback */}
                <div className="assessment-field full-width">
                  <label>Mentor Feedback (Optional)</label>

                  <textarea
                    name="feedback"
                    value={form.feedback}
                    onChange={updateField}
                    placeholder="Enter feedback for the student..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="assessment-modal-footer">
                <button
                  type="button"
                  className="assessment-cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="assessment-primary-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="assessment-spin"
                      />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Update Result"
                  ) : (
                    "Submit Result"
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
