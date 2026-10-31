
import { useCallback, useEffect, useState } from "react";
import {
  Layers,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  X,
  Power,
  BookOpen,
  IndianRupee,
  PackageCheck,
  Trash2,
  AlertTriangle
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./Bundles.css";

const initialForm = {
  bundle_code: "",
  title: "",
  description: "",
  price: "",
  original_price: "",
  display_order: "0",
  is_active: true,
  courseIds: []
};

export default function Bundles() {
  const [bundles, setBundles] = useState([]);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [form, setForm] = useState({ ...initialForm });

  const [deleteModal, setDeleteModal] = useState(null);

  // FETCH BUNDLES, COURSES AND BUNDLE ITEMS
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        { data: bundleData, error: bundleError },
        { data: courseData, error: courseError },
        { data: itemData, error: itemError }
      ] = await Promise.all([
        supabase
          .from("bundles")
          .select("*")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false }),

        supabase
          .from("courses")
          .select("id, course_code, title, category, price, is_active")
          .order("title", { ascending: true }),

        supabase
          .from("bundle_items")
          .select("id, bundle_id, course_id")
      ]);

      if (bundleError) throw bundleError;
      if (courseError) throw courseError;
      if (itemError) throw itemError;

      const itemsByBundle = {};

      (itemData || []).forEach((item) => {
        if (!itemsByBundle[item.bundle_id]) {
          itemsByBundle[item.bundle_id] = [];
        }

        itemsByBundle[item.bundle_id].push(item.course_id);
      });

      const enrichedBundles = (bundleData || []).map((bundle) => ({
        ...bundle,
        courseIds: itemsByBundle[bundle.id] || []
      }));

      setBundles(enrichedBundles);
      setCourses(courseData || []);
    } catch (err) {
      console.error("Bundle loading error:", err);
      setError(err.message || "Unable to load bundles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SEARCH AND FILTER
  const filteredBundles = bundles.filter((bundle) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      bundle.title?.toLowerCase().includes(query) ||
      bundle.bundle_code?.toLowerCase().includes(query) ||
      bundle.description?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && bundle.is_active) ||
      (statusFilter === "inactive" && !bundle.is_active);

    return matchesSearch && matchesStatus;
  });

  // ADD BUNDLE
  const openAddModal = () => {
    setEditingBundle(null);
    setForm({ ...initialForm });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // EDIT BUNDLE
  const openEditModal = (bundle) => {
    setEditingBundle(bundle);

    setForm({
      bundle_code: bundle.bundle_code || "",
      title: bundle.title || "",
      description: bundle.description || "",
      price: String(bundle.price ?? ""),
      original_price: String(bundle.original_price ?? ""),
      display_order: String(bundle.display_order ?? 0),
      is_active: bundle.is_active ?? true,
      courseIds: bundle.courseIds || []
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingBundle(null);
    setForm({ ...initialForm });
    setError("");
  };

  // FORM INPUTS
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const toggleCourse = (courseId) => {
    setForm((previous) => ({
      ...previous,
      courseIds: previous.courseIds.includes(courseId)
        ? previous.courseIds.filter((id) => id !== courseId)
        : [...previous.courseIds, courseId]
    }));
  };

  // CREATE OR UPDATE BUNDLE
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.bundle_code.trim() || !form.title.trim()) {
      setError("Bundle code and bundle title are required.");
      return;
    }

    if (form.courseIds.length === 0) {
      setError("Please select at least one course or service.");
      return;
    }

    const price = Number(form.price);

    const originalPrice =
      form.original_price === ""
        ? null
        : Number(form.original_price);

    const displayOrder = Number(form.display_order);

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid bundle price.");
      return;
    }

    if (
      originalPrice !== null &&
      (!Number.isFinite(originalPrice) || originalPrice < 0)
    ) {
      setError("Please enter a valid original price.");
      return;
    }

    if (
      originalPrice !== null &&
      originalPrice < price
    ) {
      setError("Original price cannot be lower than the bundle price.");
      return;
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setError("Display order must be a valid whole number.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      const payload = {
        bundle_code: form.bundle_code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        price,
        original_price: originalPrice,
        display_order: displayOrder,
        is_active: form.is_active
      };

      let bundleId;

      if (editingBundle) {
        const { error: updateError } = await supabase
          .from("bundles")
          .update(payload)
          .eq("id", editingBundle.id);

        if (updateError) throw updateError;

        bundleId = editingBundle.id;
      } else {
        const { data, error: insertError } = await supabase
          .from("bundles")
          .insert({
            ...payload,
            created_by: user?.id
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        bundleId = data.id;
      }

      // Replace bundle course selections when editing.
      if (editingBundle) {
        const { error: deleteError } = await supabase
          .from("bundle_items")
          .delete()
          .eq("bundle_id", bundleId);

        if (deleteError) throw deleteError;
      }

      const bundleItems = form.courseIds.map((courseId, index) => ({
        bundle_id: bundleId,
        course_id: courseId,
        display_order: index + 1
      }));

      const { error: itemsError } = await supabase
        .from("bundle_items")
        .insert(bundleItems);

      if (itemsError) {
        throw new Error(
          `Bundle details were saved, but course selection could not be saved: ${itemsError.message}`
        );
      }

      setModalOpen(false);
      setEditingBundle(null);
      setForm({ ...initialForm });

      setSuccess(
        editingBundle
          ? "Bundle updated successfully."
          : "Bundle created successfully."
      );

      await fetchData();
    } catch (err) {
      console.error("Bundle save error:", err);

      if (err.code === "23505") {
        setError("This bundle code already exists. Please use another code.");
      } else {
        setError(err.message || "Unable to save bundle.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ACTIVATE / DEACTIVATE BUNDLE
  const toggleBundleStatus = async (bundle) => {
    const action = bundle.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${bundle.title}"?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("bundles")
        .update({ is_active: !bundle.is_active })
        .eq("id", bundle.id);

      if (error) throw error;

      setSuccess(
        `Bundle ${bundle.is_active ? "deactivated" : "activated"} successfully.`
      );

      await fetchData();
    } catch (err) {
      console.error("Bundle status update error:", err);
      setError(err.message || "Unable to update bundle status.");
    }
  };

  // CHECK WHETHER A BUNDLE HAS STUDENT ENROLLMENTS
  const handleDeleteBundle = async (bundle) => {
    setError("");
    setSuccess("");

    try {
      const { count, error } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("bundle_id", bundle.id);

      if (error) {
        throw new Error(
          `Could not check student enrollments: ${error.message}`
        );
      }

      const enrollmentCount = count || 0;

      setDeleteModal({
        bundle,
        enrollmentCount,
        blocked: enrollmentCount > 0
      });
    } catch (err) {
      console.error("Bundle dependency check failed:", err);

      setError(
        `${err.message || "Unable to check bundle dependencies."} Deletion was blocked for safety.`
      );
    }
  };

  // PERMANENTLY DELETE BUNDLE
  const confirmDeleteBundle = async () => {
    if (
      !deleteModal?.bundle ||
      deleteModal.blocked ||
      deleting
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("bundles")
        .delete()
        .eq("id", deleteModal.bundle.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Bundle was not deleted. Please check your permissions."
        );
      }

      setDeleteModal(null);
      setSuccess("Bundle deleted permanently.");

      await fetchData();
    } catch (err) {
      console.error("Bundle deletion failed:", err);

      setDeleteModal(null);

      setError(
        err.message ||
        "Unable to delete bundle. It may have dependent records."
      );
    } finally {
      setDeleting(false);
    }
  };

  // DISPLAY HELPERS
  const getCourseNames = (courseIds) => {
    return courseIds
      .map((id) => courses.find((course) => course.id === id)?.title)
      .filter(Boolean);
  };

  const formatPrice = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });

  const activeBundles = bundles.filter(
    (bundle) => bundle.is_active
  ).length;

  const totalBundleCourses = bundles.reduce(
    (total, bundle) => total + bundle.courseIds.length,
    0
  );

  return (
    <div className="bundles-page">

      {/* PAGE HEADER */}
      <div className="bundles-header">
        <div>
          <span className="bundles-eyebrow">
            ACADEMY MANAGEMENT
          </span>

          <h1>Bundles</h1>

          <p>
            Combine courses and services into flexible training packages.
          </p>
        </div>

        <button
          className="bundle-add-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Create Bundle
        </button>
      </div>

      {/* ALERTS */}
      {error && !modalOpen && (
        <div className="bundles-alert bundles-alert-error">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="bundles-alert bundles-alert-success">
          {success}
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="bundles-summary-grid">

        <div className="bundle-summary-card">
          <div className="bundle-summary-icon blue">
            <Layers size={22} />
          </div>
          <div>
            <span>Total Bundles</span>
            <h2>{loading ? "..." : bundles.length}</h2>
          </div>
        </div>

        <div className="bundle-summary-card">
          <div className="bundle-summary-icon green">
            <PackageCheck size={22} />
          </div>
          <div>
            <span>Active Bundles</span>
            <h2>{loading ? "..." : activeBundles}</h2>
          </div>
        </div>

        <div className="bundle-summary-card">
          <div className="bundle-summary-icon orange">
            <BookOpen size={22} />
          </div>
          <div>
            <span>Course Selections</span>
            <h2>{loading ? "..." : totalBundleCourses}</h2>
          </div>
        </div>

      </div>

      {/* BUNDLE TABLE */}
      <div className="bundles-table-container">

        <div className="bundles-table-header">
          <div>
            <h3>All Bundles</h3>
            <p>
              Manage packages and their included courses or services.
            </p>
          </div>

          <div className="bundles-filters">

            <div className="bundles-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search bundles..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter bundle status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              className="bundles-refresh"
              onClick={fetchData}
              disabled={loading}
              title="Refresh bundles"
            >
              <RefreshCw size={17} />
            </button>

          </div>
        </div>

        <div className="bundles-table-scroll">
          <table className="bundles-table">

            <thead>
              <tr>
                <th>BUNDLE</th>
                <th>INCLUDED COURSES</th>
                <th>ORIGINAL PRICE</th>
                <th>BUNDLE PRICE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="6" className="bundles-empty">
                    Loading bundles...
                  </td>
                </tr>
              ) : filteredBundles.length > 0 ? (

                filteredBundles.map((bundle) => {
                  const courseNames = getCourseNames(bundle.courseIds);

                  return (
                    <tr key={bundle.id}>

                      <td>
                        <div className="bundle-name-cell">
                          <div className="bundle-avatar">
                            <Layers size={18} />
                          </div>
                          <div>
                            <strong>{bundle.title}</strong>
                            <span>{bundle.bundle_code}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="bundle-included-courses">
                          <strong>{bundle.courseIds.length} items</strong>
                          <span title={courseNames.join(", ")}>
                            {courseNames.length > 0
                              ? courseNames.slice(0, 2).join(", ") +
                                (courseNames.length > 2
                                  ? ` +${courseNames.length - 2} more`
                                  : "")
                              : "No courses"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {bundle.original_price !== null &&
                        bundle.original_price !== undefined
                          ? `₹${formatPrice(bundle.original_price)}`
                          : "—"}
                      </td>

                      <td>
                        <span className="bundle-price">
                          <IndianRupee size={14} />
                          {formatPrice(bundle.price)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            bundle.is_active
                              ? "bundle-status active"
                              : "bundle-status inactive"
                          }
                        >
                          {bundle.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* ROW ACTIONS */}
                      <td>
                        <div className="bundle-row-actions">

                          <button
                            className="bundle-edit-button"
                            onClick={() => openEditModal(bundle)}
                            title="Edit bundle"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="bundle-toggle-button"
                            onClick={() => toggleBundleStatus(bundle)}
                            title={
                              bundle.is_active
                                ? "Deactivate bundle"
                                : "Activate bundle"
                            }
                          >
                            <Power size={16} />
                          </button>

                          <button
                            className="bundle-delete-button"
                            onClick={() => handleDeleteBundle(bundle)}
                            title="Delete bundle"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>
                  <td colSpan="6" className="bundles-empty">
                    <div>
                      <Layers size={38} />

                      <h3>
                        {search || statusFilter !== "all"
                          ? "No matching bundles found"
                          : "No bundles created yet"}
                      </h3>

                      <p>
                        {search || statusFilter !== "all"
                          ? "Try changing your search or filter."
                          : "Create your first bundle by combining courses and services."}
                      </p>

                      {!search && statusFilter === "all" && (
                        <button onClick={openAddModal}>
                          <Plus size={16} />
                          Create First Bundle
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

              )}

            </tbody>
          </table>
        </div>

        <div className="bundles-table-footer">
          Showing {loading ? "..." : filteredBundles.length} of{" "}
          {bundles.length} bundles
        </div>

      </div>

      {/* ADD / EDIT BUNDLE MODAL */}
      {modalOpen && (
        <div
          className="bundle-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="bundle-modal">

            <div className="bundle-modal-header">
              <div>
                <span>BUNDLE MANAGEMENT</span>

                <h2>
                  {editingBundle ? "Edit Bundle" : "Create New Bundle"}
                </h2>

                <p>
                  Add bundle details and select the included courses or services.
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

              <div className="bundle-form-grid">

                <label>
                  Bundle Code *
                  <input
                    name="bundle_code"
                    value={form.bundle_code}
                    onChange={handleChange}
                    placeholder="e.g. CAREER-STARTER"
                    required
                  />
                </label>

                <label>
                  Bundle Title *
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Career Starter Pack"
                    required
                  />
                </label>

                <label>
                  Original Price (₹)
                  <input
                    type="number"
                    name="original_price"
                    min="0"
                    step="0.01"
                    value={form.original_price}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </label>

                <label>
                  Bundle Price (₹) *
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Enter bundle price"
                    required
                  />
                </label>

                <label>
                  Display Order
                  <input
                    type="number"
                    name="display_order"
                    min="0"
                    step="1"
                    value={form.display_order}
                    onChange={handleChange}
                  />
                </label>

                <label className="bundle-active-field">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  Bundle is active
                </label>

                <label className="bundle-description-field">
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe what this bundle offers..."
                    rows="3"
                  />
                </label>

              </div>

              <div className="bundle-course-selection">

                <div className="bundle-course-selection-heading">
                  <div>
                    <h3>Included Courses & Services *</h3>
                    <p>Select the items included in this bundle.</p>
                  </div>

                  <span>{form.courseIds.length} selected</span>
                </div>

                {courses.filter((course) => course.is_active).length === 0 ? (
                  <div className="bundle-no-courses">
                    No active courses available. Create or activate a course first.
                  </div>
                ) : (

                  <div className="bundle-course-list">
                    {courses
                      .filter((course) => course.is_active)
                      .map((course) => (
                        <label
                          key={course.id}
                          className={
                            form.courseIds.includes(course.id)
                              ? "bundle-course-option selected"
                              : "bundle-course-option"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={form.courseIds.includes(course.id)}
                            onChange={() => toggleCourse(course.id)}
                          />

                          <span className="bundle-course-check">
                            <BookOpen size={17} />
                          </span>

                          <span className="bundle-course-info">
                            <strong>{course.title}</strong>
                            <small>
                              {course.course_code} · {course.category}
                            </small>
                          </span>

                          <span className="bundle-course-price">
                            ₹{formatPrice(course.price)}
                          </span>
                        </label>
                      ))}
                  </div>

                )}

              </div>

              {error && (
                <div className="bundles-modal-error">
                  {error}
                </div>
              )}

              <div className="bundle-modal-actions">

                <button
                  type="button"
                  className="bundle-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bundle-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBundle
                    ? "Save Changes"
                    : "Create Bundle"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE / DEPENDENCY MODAL */}
      {deleteModal && (
        <div
          className="bundle-modal-overlay"
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
            className="bundle-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bundle-delete-title"
          >

            <div className="bundle-delete-icon">
              {deleteModal.blocked ? (
                <AlertTriangle size={25} />
              ) : (
                <Trash2 size={25} />
              )}
            </div>

            <h2 id="bundle-delete-title">
              {deleteModal.blocked
                ? "Bundle cannot be deleted"
                : "Delete bundle permanently?"}
            </h2>

            <p>
              <strong>{deleteModal.bundle.title}</strong>
            </p>

            {deleteModal.blocked ? (
              <>
                <p>
                  This bundle is linked to existing student enrollments.
                  Deleting it could affect student records and payment history.
                </p>

                <div className="bundle-dependency-list">
                  <div>
                    <span>Student enrollments</span>
                    <strong>{deleteModal.enrollmentCount}</strong>
                  </div>
                </div>

                <p className="bundle-delete-warning">
                  Deletion is blocked. You can deactivate this bundle
                  if you no longer want it available for new enrollments.
                </p>

                <div className="bundle-modal-actions">
                  <button
                    type="button"
                    className="bundle-cancel-button"
                    onClick={() => setDeleteModal(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  No student enrollments were found for this bundle.
                  Its bundle inclusions and selectable options will also
                  be removed. This action cannot be undone.
                </p>

                <div className="bundle-modal-actions">

                  <button
                    type="button"
                    className="bundle-cancel-button"
                    onClick={() => setDeleteModal(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="bundle-delete-confirm"
                    onClick={confirmDeleteBundle}
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
