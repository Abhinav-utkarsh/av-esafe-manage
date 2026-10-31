
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  X,
  IndianRupee,
  Clock3,
  Layers,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  AlertTriangle
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./Courses.css";

const initialForm = {
  course_code: "",
  title: "",
  description: "",
  category: "technical",
  duration_weeks: "",
  level: "Beginner",
  price: "0",
  display_order: "0",
  is_active: true
};

const categories = [
  { value: "technical", label: "Technical" },
  { value: "aptitude", label: "Aptitude" },
  { value: "resume", label: "Resume Building" },
  { value: "interview", label: "Interview Preparation" }
];

const levels = ["Beginner", "Intermediate", "Advanced"];

export default function Courses() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // FETCH COURSES
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCourses(data || []);
    } catch (err) {
      console.error("Courses loading error:", err);
      setError(err.message || "Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // SEARCH AND FILTER
  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title?.toLowerCase().includes(query) ||
        course.course_code?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        course.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && course.is_active) ||
        (statusFilter === "inactive" && !course.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [courses, search, categoryFilter, statusFilter]);

  // SUMMARY COUNTS
  const activeCount = courses.filter((course) => course.is_active).length;
  const inactiveCount = courses.length - activeCount;
  const categoryCount = new Set(
    courses.map((course) => course.category)
  ).size;

  // ADD COURSE
  const openAddModal = () => {
    setEditingCourse(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // EDIT COURSE
  const openEditModal = (course) => {
    setEditingCourse(course);

    setForm({
      course_code: course.course_code || "",
      title: course.title || "",
      description: course.description || "",
      category: course.category || "technical",
      duration_weeks: course.duration_weeks ?? "",
      level: course.level || "Beginner",
      price: String(course.price ?? 0),
      display_order: String(course.display_order ?? 0),
      is_active: Boolean(course.is_active)
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCourse(null);
    setForm(initialForm);
    setError("");
  };

  // FORM INPUT HANDLING
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // SAVE COURSE
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const courseCode = form.course_code.trim().toUpperCase();
    const title = form.title.trim();
    const price = Number(form.price);

    const duration =
      form.duration_weeks === ""
        ? null
        : Number(form.duration_weeks);

    const displayOrder = Number(form.display_order);

    if (!courseCode || !title) {
      setError("Course code and title are required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price greater than or equal to zero.");
      return;
    }

    if (
      duration !== null &&
      (!Number.isInteger(duration) || duration < 1)
    ) {
      setError("Duration must be a whole number of at least 1 week.");
      return;
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setError(
        "Display order must be a whole number greater than or equal to zero."
      );
      return;
    }

    const payload = {
      course_code: courseCode,
      title,
      description: form.description.trim() || null,
      category: form.category,
      duration_weeks: duration,
      level: form.level,
      price,
      display_order: displayOrder,
      is_active: form.is_active
    };

    setSaving(true);

    try {
      let result;

      if (editingCourse) {
        result = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editingCourse.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("courses")
          .insert({
            ...payload,
            created_by: user?.id || null
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setShowModal(false);
      setEditingCourse(null);
      setForm(initialForm);

      setSuccess(
        editingCourse
          ? "Course updated successfully."
          : "Course created successfully."
      );

      await fetchCourses();
    } catch (err) {
      console.error("Course save error:", err);

      if (err.code === "23505") {
        setError(
          "This course code already exists. Please use a different code."
        );
      } else {
        setError(err.message || "Unable to save course.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ACTIVATE / DEACTIVATE COURSE
  const toggleCourseStatus = async (course) => {
    const nextStatus = !course.is_active;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } "${course.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_active: nextStatus })
        .eq("id", course.id);

      if (error) throw error;

      setSuccess(
        nextStatus
          ? "Course activated successfully."
          : "Course deactivated successfully."
      );

      await fetchCourses();
    } catch (err) {
      console.error("Course status update error:", err);
      setError(err.message || "Unable to update course status.");
    }
  };

  // CHECK COURSE DEPENDENCIES BEFORE DELETION
  const handleDeleteCourse = async (course) => {
    setError("");
    setSuccess("");

    try {
      const dependencyTables = [
        { table: "bundle_items", label: "Bundle inclusions" },
        {
          table: "bundle_course_options",
          label: "Selectable bundle tracks"
        },
        {
          table: "enrollment_items",
          label: "Student enrollments"
        },
        { table: "course_modules", label: "Course modules" },
        { table: "batches", label: "Assigned batches" }
      ];

      const results = await Promise.all(
        dependencyTables.map(async (dependency) => {
          const { count, error } = await supabase
            .from(dependency.table)
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id);

          if (error) {
            throw new Error(
              `Could not check ${dependency.label}: ${error.message}`
            );
          }

          return {
            ...dependency,
            count: count || 0
          };
        })
      );

      const dependencies = results.filter(
        (item) => item.count > 0
      );

      setDeleteModal({
        course,
        dependencies,
        blocked: dependencies.length > 0
      });
    } catch (err) {
      console.error("Course dependency check failed:", err);

      setError(
        `${err.message || "Unable to check course dependencies."} Deletion was blocked for safety.`
      );
    }
  };

  // PERMANENT DELETE
  const confirmDeleteCourse = async () => {
    if (!deleteModal?.course || deleteModal.blocked || deleting) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("courses")
        .delete()
        .eq("id", deleteModal.course.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Course was not deleted. Please check your permissions."
        );
      }

      setDeleteModal(null);
      setSuccess("Course deleted permanently.");

      await fetchCourses();
    } catch (err) {
      console.error("Course deletion failed:", err);

      setDeleteModal(null);

      setError(
        err.message ||
        "Unable to delete course. It may have dependent records."
      );
    } finally {
      setDeleting(false);
    }
  };

  // DISPLAY HELPERS
  const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString("en-IN")}`;

  const getCategoryLabel = (category) =>
    categories.find((item) => item.value === category)?.label ||
    category;

  return (
    <div className="courses-page">

      {/* PAGE HEADER */}
      <div className="courses-page-header">
        <div>
          <span className="courses-eyebrow">
            ACADEMY MANAGEMENT
          </span>

          <h1>Courses & Services</h1>

          <p>
            Manage training programs, learning services, pricing and availability.
          </p>
        </div>

        <div className="courses-header-actions">
          <button
            className="courses-refresh-button"
            onClick={fetchCourses}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="courses-add-button"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Course
          </button>
        </div>
      </div>

      {/* ALERT MESSAGES */}
      {error && !showModal && (
        <div className="courses-alert error">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="courses-alert success">
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="courses-summary-grid">

        <div className="courses-summary-card">
          <div className="courses-summary-icon blue">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Total Courses & Services</span>
            <h2>{loading ? "..." : courses.length}</h2>
          </div>
        </div>

        <div className="courses-summary-card">
          <div className="courses-summary-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Active</span>
            <h2>{loading ? "..." : activeCount}</h2>
          </div>
        </div>

        <div className="courses-summary-card">
          <div className="courses-summary-icon orange">
            <ToggleLeft size={22} />
          </div>

          <div>
            <span>Inactive</span>
            <h2>{loading ? "..." : inactiveCount}</h2>
          </div>
        </div>

        <div className="courses-summary-card">
          <div className="courses-summary-icon purple">
            <Layers size={22} />
          </div>

          <div>
            <span>Categories Used</span>
            <h2>{loading ? "..." : categoryCount}</h2>
          </div>
        </div>

      </div>

      {/* COURSES TABLE */}
      <div className="courses-content-card">

        <div className="courses-content-header">
          <div>
            <h3>All Courses & Services</h3>
            <p>
              Manage the programs offered by Av_eSAFE Academy.
            </p>
          </div>

          <div className="courses-filters">

            <div className="courses-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search by name or code..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option
                  key={category.value}
                  value={category.value}
                >
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

          </div>
        </div>

        <div className="courses-table-scroll">
          <table className="courses-table">

            <thead>
              <tr>
                <th>COURSE / SERVICE</th>
                <th>CODE</th>
                <th>CATEGORY</th>
                <th>DURATION</th>
                <th>LEVEL</th>
                <th>PRICE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="8" className="courses-empty">
                    Loading courses...
                  </td>
                </tr>
              ) : filteredCourses.length > 0 ? (

                filteredCourses.map((course) => (
                  <tr key={course.id}>

                    <td>
                      <div className="courses-title-cell">
                        <div className="courses-book-icon">
                          <BookOpen size={17} />
                        </div>

                        <div>
                          <strong>{course.title}</strong>

                          <span>
                            {course.description || "No description added"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="courses-code">
                        {course.course_code}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`courses-category ${course.category}`}
                      >
                        {getCategoryLabel(course.category)}
                      </span>
                    </td>

                    <td>
                      <span className="courses-duration">
                        <Clock3 size={14} />

                        {course.duration_weeks
                          ? `${course.duration_weeks} weeks`
                          : "Not specified"}
                      </span>
                    </td>

                    <td>{course.level || "—"}</td>

                    <td className="courses-price">
                      {formatPrice(course.price)}
                    </td>

                    <td>
                      <span
                        className={`courses-status ${
                          course.is_active ? "active" : "inactive"
                        }`}
                      >
                        {course.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="courses-row-actions">

                        <button
                          className="courses-icon-button edit"
                          onClick={() => openEditModal(course)}
                          title="Edit course"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className={`courses-icon-button ${
                            course.is_active
                              ? "deactivate"
                              : "activate"
                          }`}
                          onClick={() => toggleCourseStatus(course)}
                          title={
                            course.is_active
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          {course.is_active ? (
                            <ToggleRight size={19} />
                          ) : (
                            <ToggleLeft size={19} />
                          )}
                        </button>

                        <button
                          className="courses-icon-button delete"
                          onClick={() => handleDeleteCourse(course)}
                          title="Delete course"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))

              ) : (

                <tr>
                  <td colSpan="8" className="courses-empty">
                    <div>
                      <BookOpen size={38} />

                      <h3>
                        {courses.length === 0
                          ? "No courses added yet"
                          : "No matching courses found"}
                      </h3>

                      <p>
                        {courses.length === 0
                          ? "Add your first course or service to get started."
                          : "Try changing your search or filters."}
                      </p>

                      {courses.length === 0 && (
                        <button
                          className="courses-empty-add"
                          onClick={openAddModal}
                        >
                          <Plus size={16} />
                          Add Your First Course
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

              )}

            </tbody>
          </table>
        </div>

        <div className="courses-table-footer">
          Showing {loading ? "..." : filteredCourses.length} of{" "}
          {courses.length} courses/services
        </div>

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="courses-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="courses-modal">

            <div className="courses-modal-header">
              <div>
                <span>COURSE CONFIGURATION</span>

                <h2>
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </h2>

                <p>
                  Enter the details of the training course or service.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="courses-form-grid">

                <label className="courses-form-field">
                  Course Code *

                  <input
                    name="course_code"
                    value={form.course_code}
                    onChange={handleChange}
                    placeholder="Example: WEB-DEV"
                    maxLength="30"
                    required
                  />
                </label>

                <label className="courses-form-field">
                  Course / Service Title *

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Example: Web Development"
                    maxLength="150"
                    required
                  />
                </label>

                <label className="courses-form-field">
                  Category *

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    {categories.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="courses-form-field">
                  Difficulty Level

                  <select
                    name="level"
                    value={form.level}
                    onChange={handleChange}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="courses-form-field">
                  Duration (Weeks)

                  <input
                    type="number"
                    name="duration_weeks"
                    value={form.duration_weeks}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="Example: 8"
                  />
                </label>

                <label className="courses-form-field">
                  Price (INR)

                  <div className="courses-price-input">
                    <IndianRupee size={16} />

                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </label>

                <label className="courses-form-field">
                  Display Order

                  <input
                    type="number"
                    name="display_order"
                    value={form.display_order}
                    onChange={handleChange}
                    min="0"
                    step="1"
                  />
                </label>

                <label className="courses-form-field courses-description-field">
                  Description

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    maxLength="1000"
                    placeholder="Briefly describe what students will learn..."
                  />
                </label>

              </div>

              <label className="courses-active-toggle">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />

                <span>
                  <strong>Make this course active</strong>

                  <small>
                    Active courses can be selected for new enrollments.
                  </small>
                </span>
              </label>

              {error && (
                <div className="courses-modal-error">
                  {error}
                </div>
              )}

              <div className="courses-modal-actions">

                <button
                  type="button"
                  className="courses-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="courses-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCourse
                    ? "Save Changes"
                    : "Create Course"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / DEPENDENCY MODAL */}
      {deleteModal && (
        <div
          className="courses-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setDeleteModal(null);
            }
          }}
        >
          <div
            className="courses-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="courses-delete-title"
          >

            <div className="courses-delete-icon">
              {deleteModal.blocked ? (
                <AlertTriangle size={25} />
              ) : (
                <Trash2 size={25} />
              )}
            </div>

            <h2 id="courses-delete-title">
              {deleteModal.blocked
                ? "Course cannot be deleted"
                : "Delete course permanently?"}
            </h2>

            <p>
              <strong>{deleteModal.course.title}</strong>
            </p>

            {deleteModal.blocked ? (
              <>
                <p>
                  This course is referenced by the following records.
                  Remove those dependencies before deleting it.
                </p>

                <div className="courses-dependency-list">
                  {deleteModal.dependencies.map((item) => (
                    <div key={item.table}>
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>

                <p className="courses-delete-warning">
                  Existing student, bundle, batch and learning records
                  will not be deleted. You can deactivate this course instead.
                </p>

                <div className="courses-modal-actions">
                  <button
                    type="button"
                    className="courses-cancel-button"
                    onClick={() => setDeleteModal(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  No dependent records were found. This action will
                  permanently remove this course from the database.
                  This cannot be undone.
                </p>

                <div className="courses-modal-actions">

                  <button
                    type="button"
                    className="courses-cancel-button"
                    onClick={() => setDeleteModal(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="courses-delete-confirm"
                    onClick={confirmDeleteCourse}
                    disabled={deleting}
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete Permanently"}
                  </button>

                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
