
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Plus,
  X,
  BookOpen,
  Layers,
  IndianRupee,
  Trash2,
  AlertTriangle
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./Enrollments.css";

const createInitialForm = () => ({
  student_id: "",
  enrollment_type: "individual",
  course_ids: [],
  bundle_id: "",
  technical_track_course_id: "",
  enrollment_date: new Date().toISOString().slice(0, 10),
  total_fee: "",
  enrollment_status: "active",
  notes: "",
  batchAssignments: {}
});

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [bundleItems, setBundleItems] = useState([]);
  const [bundleOptions, setBundleOptions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(createInitialForm());

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Add courses to an existing enrollment
  const [addCoursesTarget, setAddCoursesTarget] = useState(null);
  const [additionalCourseIds, setAdditionalCourseIds] = useState([]);
  const [additionalBatchAssignments, setAdditionalBatchAssignments] = useState({});
  const [additionalSaving, setAdditionalSaving] = useState(false);
  const [additionalError, setAdditionalError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.all([
        supabase
          .from("enrollments")
          .select(`
            id,
            student_id,
            bundle_id,
            enrollment_type,
            enrollment_date,
            enrollment_status,
            payment_status,
            total_fee,
            amount_paid,
            notes,
            created_at,
            profiles:student_id (
              full_name,
              email
            ),
            bundles (
              title,
              bundle_code
            ),
            enrollment_items (
              id,
              course_id,
              course_title_snapshot,
              batch_id,
              price_snapshot,
              progress_percentage,
              item_status,
              batches (
                batch_name,
                batch_code
              )
            )
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("id, full_name, email, phone, account_status")
          .eq("role", "student")
          .eq("account_status", "active")
          .order("full_name"),

        supabase
          .from("courses")
          .select("id, course_code, title, category, price, duration_weeks, is_active")
          .eq("is_active", true)
          .order("title"),

        supabase
          .from("bundles")
          .select("id, bundle_code, title, price, is_active")
          .eq("is_active", true)
          .order("title"),

        supabase
          .from("bundle_items")
          .select("bundle_id, course_id, display_order"),

        supabase
          .from("bundle_course_options")
          .select("bundle_id, course_id, option_group_key"),

        supabase
          .from("batches")
          .select("id, batch_code, batch_name, course_id, status, start_date, end_date")
          .in("status", ["upcoming", "ongoing"])
          .order("start_date"),

        supabase
          .from("student_applications")
          .select("id, full_name, email, interested_track, selected_bundle, bundle_coding_track, total_price, payment_status, application_status, created_at")
          .order("created_at", { ascending: false })
      ]);

      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;

      const [
        enrollmentResult,
        studentResult,
        courseResult,
        bundleResult,
        bundleItemResult,
        bundleOptionResult,
        batchResult,
        applicationResult
      ] = results;

      setEnrollments(enrollmentResult.data || []);
      setStudents(studentResult.data || []);
      setCourses(courseResult.data || []);
      setBundles(bundleResult.data || []);
      setBundleItems(bundleItemResult.data || []);
      setBundleOptions(bundleOptionResult.data || []);
      setBatches(batchResult.data || []);
      setStudentApplications(applicationResult.data || []);
    } catch (err) {
      console.error("Enrollment loading error:", err);
      setError(err.message || "Unable to load enrollment information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedBundleFixedCourses = useMemo(() => {
    if (!form.bundle_id) return [];

    return bundleItems
      .filter((item) => item.bundle_id === form.bundle_id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((item) => courses.find((course) => course.id === item.course_id))
      .filter(Boolean);
  }, [form.bundle_id, bundleItems, courses]);

  const selectedBundleTechnicalOptions = useMemo(() => {
    if (!form.bundle_id) return [];

    return bundleOptions
      .filter((option) => option.bundle_id === form.bundle_id)
      .map((option) => courses.find((course) => course.id === option.course_id))
      .filter((course) => course?.category === "technical");
  }, [form.bundle_id, bundleOptions, courses]);

  const selectedTechnicalCourse = courses.find(
    (course) => course.id === form.technical_track_course_id
  );

  const selectedIndividualCourses = courses.filter((course) =>
    form.course_ids.includes(course.id)
  );

  const enrollmentCourses = useMemo(() => {
    if (form.enrollment_type === "individual") {
      return selectedIndividualCourses;
    }

    const combined = [...selectedBundleFixedCourses];

    if (
      selectedTechnicalCourse &&
      selectedBundleTechnicalOptions.some(
        (course) => course.id === selectedTechnicalCourse.id
      )
    ) {
      combined.push(selectedTechnicalCourse);
    }

    return combined;
  }, [
    form.enrollment_type,
    selectedIndividualCourses,
    selectedBundleFixedCourses,
    selectedTechnicalCourse,
    selectedBundleTechnicalOptions
  ]);

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const query = search.toLowerCase();

    const matchesSearch =
      enrollment.profiles?.full_name?.toLowerCase().includes(query) ||
      enrollment.profiles?.email?.toLowerCase().includes(query) ||
      enrollment.bundles?.title?.toLowerCase().includes(query) ||
      enrollment.enrollment_items?.some((item) =>
        item.course_title_snapshot?.toLowerCase().includes(query)
      );

    const matchesStatus =
      statusFilter === "all" ||
      enrollment.enrollment_status === statusFilter;

    const matchesType =
      typeFilter === "all" ||
      enrollment.enrollment_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const alreadyEnrolledCourseIds = useMemo(() => {
    if (!addCoursesTarget) return [];
    return (addCoursesTarget.enrollment_items || []).map((item) => item.course_id);
  }, [addCoursesTarget]);

  const availableAdditionalCourses = useMemo(() => {
    return courses.filter((course) => !alreadyEnrolledCourseIds.includes(course.id));
  }, [courses, alreadyEnrolledCourseIds]);

  const additionalCoursesSelected = useMemo(() => {
    return availableAdditionalCourses.filter((course) => additionalCourseIds.includes(course.id));
  }, [availableAdditionalCourses, additionalCourseIds]);

  const additionalCoursesFee = additionalCoursesSelected.reduce(
    (sum, course) => sum + Number(course.price || 0), 0
  );

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const updateForm = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  
const normalizeCourseName = (value) =>
  String(value || "")
    .toLowerCase()
    // Make "and" equivalent to "&"
    .replace(/\band\b/g, "")
    // Remove spaces and special characters
    .replace(/[^a-z0-9]/g, "");


  const handleStudentChange = (studentId) => {
    const student = students.find((item) => item.id === studentId);
    if (!student) {
      updateForm("student_id", studentId);
      return;
    }

    const normalizedStudentEmail = String(student.email || "")
      .trim()
      .toLowerCase();

    // Always use the newest application for this email, even when the
    // newest application is still pending verification or approval.
    const application = [...studentApplications]
      .filter((item) =>
        String(item.email || "").trim().toLowerCase() === normalizedStudentEmail
      )
      .sort((a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      )[0];

    // No public application found: retain the standard manual enrollment flow.
    if (!application) {
      setForm((previous) => ({ ...previous, student_id: studentId }));
      return;
    }

    const applicationBundleName = application.selected_bundle?.trim();
    const matchedBundle = applicationBundleName
      ? bundles.find((bundle) =>
          normalizeCourseName(bundle.title) === normalizeCourseName(applicationBundleName)
        )
      : null;

    if (matchedBundle) {
      const technicalCourse = courses.find((course) =>
        normalizeCourseName(course.title) === normalizeCourseName(application.bundle_coding_track)
      );

      setForm((previous) => ({
        ...previous,
        student_id: studentId,
        enrollment_type: "bundle",
        course_ids: [],
        bundle_id: matchedBundle.id,
        technical_track_course_id: technicalCourse?.id || "",
        total_fee: String(application.total_price ?? matchedBundle.price ?? 0),
        batchAssignments: {}
      }));
      setError("");
      return;
    }

    const applicationTracks = String(application.interested_track || "")
      .split(",")
      .map((track) => track.trim())
      .filter(Boolean);

    
const matchedCourseIds = courses
  .filter((course) =>
    applicationTracks.some((track) => {
      const normalizedTrack = normalizeCourseName(track);
      const normalizedCourse = normalizeCourseName(course.title);

      // Exact match
      if (normalizedTrack === normalizedCourse) {
        return true;
      }

      // Handle SQL and Database vs SQL & Database Management
      if (
        normalizedTrack === "sqldatabase" &&
        normalizedCourse === "sqldatabasemanagement"
      ) {
        return true;
      }

      return false;
    })
  )
  .map((course) => course.id);


    const matchedTotal = courses
      .filter((course) => matchedCourseIds.includes(course.id))
      .reduce((sum, course) => sum + Number(course.price || 0), 0);

    setForm((previous) => ({
      ...previous,
      student_id: studentId,
      enrollment_type: "individual",
      course_ids: matchedCourseIds,
      bundle_id: "",
      technical_track_course_id: "",
      total_fee: String(application.total_price ?? matchedTotal),
      batchAssignments: {}
    }));
    setError("");
  };

  const openAddModal = () => {
    setForm(createInitialForm());
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(createInitialForm());
    setError("");
  };

  const handleTypeChange = (type) => {
    setForm((previous) => ({
      ...previous,
      enrollment_type: type,
      course_ids: [],
      bundle_id: "",
      technical_track_course_id: "",
      total_fee: "",
      batchAssignments: {}
    }));
    setError("");
  };

  const handleCourseSelection = (courseId, checked) => {
    const nextIds = checked
      ? [...form.course_ids, courseId]
      : form.course_ids.filter((id) => id !== courseId);

    const nextCourses = courses.filter((course) =>
      nextIds.includes(course.id)
    );

    const total = nextCourses.reduce(
      (sum, course) => sum + Number(course.price || 0),
      0
    );

    setForm((previous) => ({
      ...previous,
      course_ids: nextIds,
      total_fee: String(total),
      batchAssignments: Object.fromEntries(
        Object.entries(previous.batchAssignments).filter(([id]) =>
          nextIds.includes(id)
        )
      )
    }));
    setError("");
  };

  const handleBundleChange = (bundleId) => {
    const selected = bundles.find((bundle) => bundle.id === bundleId);

    setForm((previous) => ({
      ...previous,
      bundle_id: bundleId,
      technical_track_course_id: "",
      total_fee: selected ? String(selected.price ?? "") : "",
      batchAssignments: {}
    }));
  };

  const handleBatchChange = (courseId, batchId) => {
    setForm((previous) => ({
      ...previous,
      batchAssignments: {
        ...previous.batchAssignments,
        [courseId]: batchId
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.student_id) {
      setError("Please select an active student.");
      return;
    }

    if (!form.enrollment_date) {
      setError("Please select an enrollment date.");
      return;
    }

    if (form.enrollment_type === "individual" && form.course_ids.length === 0) {
      setError("Please select at least one individual course or service.");
      return;
    }

    if (form.enrollment_type === "bundle") {
      if (!form.bundle_id) {
        setError("Please select a bundle.");
        return;
      }

      if (selectedBundleTechnicalOptions.length === 0) {
        setError("No technical track options are configured for this bundle.");
        return;
      }

      if (!form.technical_track_course_id) {
        setError("Please select one technical track for this bundle.");
        return;
      }

      if (
        !selectedBundleTechnicalOptions.some(
          (course) => course.id === form.technical_track_course_id
        )
      ) {
        setError("Please select a valid technical track option.");
        return;
      }
    }

    if (enrollmentCourses.length === 0) {
      setError("No courses or services are configured for this selection.");
      return;
    }

    const totalFee = Number(form.total_fee);

    if (!Number.isFinite(totalFee) || totalFee < 0) {
      setError("Please enter a valid enrollment fee.");
      return;
    }

    for (const course of enrollmentCourses) {
      const batchId = form.batchAssignments[course.id];

      if (batchId) {
        const batch = batches.find((item) => item.id === batchId);

        if (!batch || batch.course_id !== course.id) {
          setError(`The selected batch does not belong to ${course.title}.`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      const isBundle = form.enrollment_type === "bundle";

      const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .insert({
          student_id: form.student_id,
          enrollment_type: form.enrollment_type,
          bundle_id: isBundle ? form.bundle_id : null,
          enrollment_date: form.enrollment_date,
          enrollment_status: form.enrollment_status,
          payment_status: "pending",
          total_fee: totalFee,
          amount_paid: 0,
          notes: form.notes.trim() || null,
          created_by: user?.id
        })
        .select("id")
        .single();

      if (enrollmentError) throw enrollmentError;

      const itemPayload = enrollmentCourses.map((course) => ({
        enrollment_id: enrollment.id,
        course_id: course.id,
        batch_id: form.batchAssignments[course.id] || null,
        course_title_snapshot: course.title,
        price_snapshot: Number(course.price || 0),
        progress_percentage: 0,
        item_status: "active"
      }));

      const { error: itemsError } = await supabase
        .from("enrollment_items")
        .insert(itemPayload);

      if (itemsError) {
        const { error: cleanupError } = await supabase
          .from("enrollments")
          .delete()
          .eq("id", enrollment.id);

        if (cleanupError) {
          console.error("Enrollment cleanup failed:", cleanupError);
        }

        throw itemsError;
      }

      setModalOpen(false);
      setForm(createInitialForm());
      setSuccess("Student enrollment created successfully.");
      await fetchData();
    } catch (err) {
      console.error("Enrollment creation error:", err);

      if (err.code === "23505") {
        setError("A duplicate course entry was detected. Please check the selection.");
      } else {
        setError(err.message || "Unable to create enrollment.");
      }
    } finally {
      setSaving(false);
    }
  };

  const openAddCourses = (enrollment) => {
    setAddCoursesTarget(enrollment);
    setAdditionalCourseIds([]);
    setAdditionalBatchAssignments({});
    setAdditionalError("");
  };

  const closeAddCourses = () => {
    if (additionalSaving) return;
    setAddCoursesTarget(null);
    setAdditionalCourseIds([]);
    setAdditionalBatchAssignments({});
    setAdditionalError("");
  };

  const toggleAdditionalCourse = (courseId, checked) => {
    setAdditionalCourseIds((previous) =>
      checked ? [...previous, courseId] : previous.filter((id) => id !== courseId)
    );
    if (!checked) {
      setAdditionalBatchAssignments((previous) => {
        const next = { ...previous };
        delete next[courseId];
        return next;
      });
    }
    setAdditionalError("");
  };

  const saveAdditionalCourses = async (event) => {
    event.preventDefault();
    if (!addCoursesTarget || additionalCourseIds.length === 0) {
      setAdditionalError("Please select at least one additional course or service.");
      return;
    }

    for (const course of additionalCoursesSelected) {
      const batchId = additionalBatchAssignments[course.id];
      if (batchId) {
        const batch = batches.find((item) => item.id === batchId);
        if (!batch || batch.course_id !== course.id) {
          setAdditionalError(`The selected batch does not belong to ${course.title}.`);
          return;
        }
      }
    }

    setAdditionalSaving(true);
    setAdditionalError("");
    try {
      // Read the latest fee immediately before updating it.
      const { data: latestEnrollment, error: readError } = await supabase
        .from("enrollments")
        .select("id, total_fee, amount_paid")
        .eq("id", addCoursesTarget.id)
        .single();
      if (readError) throw readError;

      const existingIds = (addCoursesTarget.enrollment_items || []).map((item) => item.course_id);
      if (additionalCourseIds.some((id) => existingIds.includes(id))) {
        throw new Error("One or more selected courses are already part of this enrollment. Refresh and try again.");
      }

      const itemPayload = additionalCoursesSelected.map((course) => ({
        enrollment_id: addCoursesTarget.id,
        course_id: course.id,
        batch_id: additionalBatchAssignments[course.id] || null,
        course_title_snapshot: course.title,
        price_snapshot: Number(course.price || 0),
        progress_percentage: 0,
        item_status: "active"
      }));

      const { data: insertedItems, error: insertError } = await supabase
        .from("enrollment_items")
        .insert(itemPayload)
        .select("id");
      if (insertError) throw insertError;

      const newTotalFee = Number(latestEnrollment.total_fee || 0) + additionalCoursesFee;
      const paidAmount = Number(latestEnrollment.amount_paid || 0);
      const newPaymentStatus = paidAmount >= newTotalFee
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : "pending";

      const { error: feeError } = await supabase
        .from("enrollments")
        .update({
          total_fee: newTotalFee,
          payment_status: newPaymentStatus
        })
        .eq("id", addCoursesTarget.id);

      if (feeError) {
        // Roll back the newly added items if the fee update fails.
        const insertedIds = (insertedItems || []).map((item) => item.id);
        if (insertedIds.length) {
          const { error: rollbackError } = await supabase
            .from("enrollment_items")
            .delete()
            .in("id", insertedIds);
          if (rollbackError) console.error("Additional course rollback failed:", rollbackError);
        }
        throw feeError;
      }

      setAddCoursesTarget(null);
      setAdditionalCourseIds([]);
      setAdditionalBatchAssignments({});
      setSuccess(`${additionalCourseIds.length} course/service(s) added. Enrollment fee updated to ₹${formatMoney(newTotalFee)}.`);
      await fetchData();
    } catch (err) {
      console.error("Adding courses to enrollment failed:", err);
      if (err.code === "23505") {
        setAdditionalError("A selected course is already enrolled. Refresh the page and try again.");
      } else {
        setAdditionalError(err.message || "Unable to add courses to this enrollment.");
      }
    } finally {
      setAdditionalSaving(false);
    }
  };

  const requestDelete = (enrollment) => {
    setDeleteError("");
    setDeleteTarget(enrollment);
  };

  const cancelDelete = () => {
    if (deletingId) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setDeleteError("");

    try {
      const { count, error: paymentCheckError } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("enrollment_id", deleteTarget.id);

      if (paymentCheckError) throw paymentCheckError;

      if (count > 0) {
        setDeleteError(
          `This enrollment has ${count} payment record(s). Deletion is blocked to protect payment history.`
        );
        return;
      }

      const { error: deleteErrorFromDb } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", deleteTarget.id);

      if (deleteErrorFromDb) throw deleteErrorFromDb;

      setDeleteTarget(null);
      setSuccess("Enrollment deleted successfully.");
      await fetchData();
    } catch (err) {
      console.error("Enrollment deletion error:", err);
      setDeleteError(
        err.message || "Unable to delete this enrollment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getPaymentLabel = (status) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="enrollments-page">
      <div className="enrollments-header">
        <div>
          <span className="enrollments-eyebrow">ACADEMY MANAGEMENT</span>
          <h1>Enrollments</h1>
          <p>Enroll students in multiple courses or bundles and assign batches.</p>
        </div>

        <button className="enrollment-add-button" onClick={openAddModal}>
          <Plus size={18} />
          Create Enrollment
        </button>
      </div>

      {error && !modalOpen && (
        <div className="enrollments-alert error">
          {error}
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="enrollments-alert success">
          {success}
          <button onClick={() => setSuccess("")}><X size={16} /></button>
        </div>
      )}

      <div className="enrollments-summary-grid">
        <div className="enrollment-summary-card">
          <div className="enrollment-summary-icon blue"><ClipboardList size={22} /></div>
          <div><span>Total Enrollments</span><h2>{loading ? "..." : enrollments.length}</h2></div>
        </div>

        <div className="enrollment-summary-card">
          <div className="enrollment-summary-icon green"><BookOpen size={22} /></div>
          <div>
            <span>Active Enrollments</span>
            <h2>{loading ? "..." : enrollments.filter((item) => item.enrollment_status === "active").length}</h2>
          </div>
        </div>

        <div className="enrollment-summary-card">
          <div className="enrollment-summary-icon orange"><Layers size={22} /></div>
          <div>
            <span>Bundle Enrollments</span>
            <h2>{loading ? "..." : enrollments.filter((item) => item.enrollment_type === "bundle").length}</h2>
          </div>
        </div>

        <div className="enrollment-summary-card">
          <div className="enrollment-summary-icon purple"><IndianRupee size={22} /></div>
          <div>
            <span>Outstanding Amount</span>
            <h2>₹{loading ? "..." : formatMoney(enrollments.reduce((sum, item) => sum + Math.max(0, Number(item.total_fee || 0) - Number(item.amount_paid || 0)), 0))}</h2>
          </div>
        </div>
      </div>

      <div className="enrollments-table-container">
        <div className="enrollments-table-header">
          <div>
            <h3>All Enrollments</h3>
            <p>Student enrollment records and purchased services.</p>
          </div>

          <div className="enrollments-filters">
            <div className="enrollments-search">
              <Search size={17} />
              <input
                placeholder="Search student or course..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="bundle">Bundle</option>
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on_hold">On Hold</option>
            </select>

            <button className="enrollments-refresh" onClick={fetchData} disabled={loading} title="Refresh enrollments">
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="enrollments-table-scroll">
          <table className="enrollments-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ENROLLMENT</th>
                <th>COURSES / SERVICES</th>
                <th>DATE</th>
                <th>TOTAL FEE</th>
                <th>PAYMENT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="enrollments-empty">Loading enrollments...</td></tr>
              ) : filteredEnrollments.length > 0 ? (
                filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>
                      <div className="enrollment-student-cell">
                        <div className="enrollment-student-avatar">
                          {enrollment.profiles?.full_name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <strong>{enrollment.profiles?.full_name || "Student"}</strong>
                          <span>{enrollment.profiles?.email || "—"}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`enrollment-type ${enrollment.enrollment_type}`}>
                        {enrollment.enrollment_type === "bundle" ? "Bundle" : "Individual"}
                      </span>
                      {enrollment.bundles?.title && (
                        <small className="enrollment-bundle-name">{enrollment.bundles.title}</small>
                      )}
                    </td>

                    <td>
                      <div className="enrollment-course-list">
                        {(enrollment.enrollment_items || []).map((item) => (
                          <span key={item.id}>{item.course_title_snapshot}</span>
                        ))}
                        {(!enrollment.enrollment_items || enrollment.enrollment_items.length === 0) && "—"}
                      </div>
                    </td>

                    <td>{formatDate(enrollment.enrollment_date)}</td>
                    <td><strong className="enrollment-fee">₹{formatMoney(enrollment.total_fee)}</strong></td>

                    <td>
                      <div className="enrollment-payment-cell">
                        {(() => {
                          const totalFee = Number(enrollment.total_fee || 0);
                          const paidAmount = Number(enrollment.amount_paid || 0);
                          const pendingAmount = Math.max(0, totalFee - paidAmount);
                          const displayStatus = paidAmount >= totalFee
                            ? "paid"
                            : paidAmount > 0
                              ? "partial"
                              : "pending";

                          return (
                            <>
                              <span className={`enrollment-payment ${displayStatus}`}>
                                {displayStatus === "partial" ? "Partially Paid" : getPaymentLabel(displayStatus)}
                              </span>
                              <small className="enrollment-paid-amount">Paid: ₹{formatMoney(paidAmount)}</small>
                              <small className="enrollment-pending-amount">Pending: ₹{formatMoney(pendingAmount)}</small>
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    <td>
                      <span className={`enrollment-status ${enrollment.enrollment_status}`}>
                        {getPaymentLabel(enrollment.enrollment_status)}
                      </span>
                    </td>

                    <td>
                      <div className="enrollment-row-actions">
                        <button
                          className="enrollment-add-courses-button"
                          onClick={() => openAddCourses(enrollment)}
                          title="Add courses or services to this enrollment"
                        >
                          <Plus size={14} />
                          Add Courses
                        </button>
                        <button
                        className="enrollment-delete-button"
                        onClick={() => requestDelete(enrollment)}
                        title="Delete enrollment"
                      >
                        <Trash2 size={15} />
                        Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="enrollments-empty">
                    <div>
                      <ClipboardList size={38} />
                      <h3>{search || statusFilter !== "all" || typeFilter !== "all" ? "No matching enrollments found" : "No enrollments yet"}</h3>
                      <p>{search || statusFilter !== "all" || typeFilter !== "all" ? "Try changing your search or filters." : "Create an enrollment after verifying the student's payment."}</p>
                      {!search && statusFilter === "all" && typeFilter === "all" && (
                        <button onClick={openAddModal}><Plus size={16} />Create First Enrollment</button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="enrollments-table-footer">
          Showing {loading ? "..." : filteredEnrollments.length} of {enrollments.length} enrollments
        </div>
      </div>

      {modalOpen && (
        <div className="enrollment-modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <div className="enrollment-modal">
            <div className="enrollment-modal-header">
              <div>
                <span>ENROLLMENT MANAGEMENT</span>
                <h2>Create Student Enrollment</h2>
                <p>Select an active student and assign one or more courses or a bundle.</p>
              </div>
              <button onClick={closeModal} disabled={saving} aria-label="Close"><X size={21} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="enrollment-form-grid">
                <label className="enrollment-full-field">
                  Select Active Student *
                  <select value={form.student_id} onChange={(event) => handleStudentChange(event.target.value)} required>
                    <option value="">Choose an active student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} — {student.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Enrollment Type *
                  <select value={form.enrollment_type} onChange={(event) => handleTypeChange(event.target.value)}>
                    <option value="individual">Individual Courses</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </label>

                <label>
                  Enrollment Date *
                  <input type="date" value={form.enrollment_date} onChange={(event) => updateForm("enrollment_date", event.target.value)} required />
                </label>

                {form.enrollment_type === "individual" ? (
                  <div className="enrollment-full-field">
                    <div className="enrollment-course-picker-heading">
                      <strong>Select Courses / Services *</strong>
                      <span>{form.course_ids.length} selected</span>
                    </div>

                    <div className="enrollment-course-picker">
                      {courses.map((course) => (
                        <label className="enrollment-course-option" key={course.id}>
                          <input
                            type="checkbox"
                            checked={form.course_ids.includes(course.id)}
                            onChange={(event) => handleCourseSelection(course.id, event.target.checked)}
                          />
                          <span className="enrollment-course-option-name">
                            <strong>{course.title}</strong>
                            <small>{course.category} · {course.duration_weeks || "—"} weeks</small>
                          </span>
                          <span className="enrollment-course-option-price">₹{formatMoney(course.price)}</span>
                        </label>
                      ))}
                      {courses.length === 0 && <p>No active courses or services available.</p>}
                    </div>
                    <small className="enrollment-field-help">Select as many courses or services as the student has purchased.</small>
                  </div>
                ) : (
                  <>
                    <label className="enrollment-full-field">
                      Select Bundle *
                      <select value={form.bundle_id} onChange={(event) => handleBundleChange(event.target.value)} required>
                        <option value="">Choose a bundle</option>
                        {bundles.map((bundle) => (
                          <option key={bundle.id} value={bundle.id}>
                            {bundle.title} — ₹{formatMoney(bundle.price)}
                          </option>
                        ))}
                      </select>
                    </label>

                    {form.bundle_id && (
                      <label className="enrollment-full-field">
                        Choose One Technical Track *
                        <select
                          value={form.technical_track_course_id}
                          onChange={(event) => {
                            setForm((previous) => ({
                              ...previous,
                              technical_track_course_id: event.target.value,
                              batchAssignments: {}
                            }));
                            setError("");
                          }}
                          required
                        >
                          <option value="">Select one technical course</option>
                          {selectedBundleTechnicalOptions.map((course) => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))}
                        </select>
                        <small className="enrollment-field-help">Select exactly one technical track included in this bundle.</small>
                      </label>
                    )}

                    {form.bundle_id && (
                      <div className="enrollment-full-field enrollment-bundle-preview">
                        <strong>Included fixed services</strong>
                        {selectedBundleFixedCourses.length > 0 ? (
                          <ul>{selectedBundleFixedCourses.map((course) => <li key={course.id}>{course.title}</li>)}</ul>
                        ) : <p>No fixed services are configured for this bundle.</p>}
                        <p>Your selected technical track will be added automatically.</p>
                      </div>
                    )}
                  </>
                )}

                <label>
                  Total Enrollment Fee (₹) *
                  <input type="number" min="0" step="0.01" value={form.total_fee} onChange={(event) => updateForm("total_fee", event.target.value)} placeholder="Enter fee" required />
                </label>

                <label>
                  Enrollment Status *
                  <select value={form.enrollment_status} onChange={(event) => updateForm("enrollment_status", event.target.value)}>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>

                <label className="enrollment-full-field">
                  Notes
                  <textarea rows="3" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Optional enrollment notes..." />
                </label>
              </div>

              {enrollmentCourses.length > 0 && (
                <div className="enrollment-batch-section">
                  <div className="enrollment-batch-heading">
                    <h3>Batch Assignment</h3>
                    <p>Assign a batch to each course where applicable.</p>
                  </div>

                  {enrollmentCourses.map((course) => {
                    const matchingBatches = batches.filter((batch) => batch.course_id === course.id);

                    return (
                      <div className="enrollment-batch-row" key={course.id}>
                        <div>
                          <strong>{course.title}</strong>
                          <small>{course.course_code}</small>
                        </div>
                        <select value={form.batchAssignments[course.id] || ""} onChange={(event) => handleBatchChange(course.id, event.target.value)}>
                          <option value="">No batch assignment</option>
                          {matchingBatches.map((batch) => (
                            <option key={batch.id} value={batch.id}>{batch.batch_name} ({batch.status})</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="enrollment-payment-note">
                <IndianRupee size={17} />
                Payment starts as Pending. Record and verify the payment separately in the Payments module.
              </div>

              {students.length === 0 && (
                <div className="enrollment-modal-error">No active student accounts are available. Activate a student account first.</div>
              )}

              {error && <div className="enrollment-modal-error">{error}</div>}

              <div className="enrollment-modal-actions">
                <button type="button" className="enrollment-cancel-button" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="enrollment-save-button" disabled={saving || students.length === 0}>
                  {saving ? "Creating..." : "Create Enrollment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addCoursesTarget && (
        <div className="enrollment-modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAddCourses();
        }}>
          <div className="enrollment-modal add-courses-modal">
            <div className="enrollment-modal-header">
              <div>
                <span>ENROLLMENT MANAGEMENT</span>
                <h2>Add Courses / Services</h2>
                <p>Add more purchased services to {addCoursesTarget.profiles?.full_name || "this student"}'s existing enrollment.</p>
              </div>
              <button onClick={closeAddCourses} disabled={additionalSaving} aria-label="Close"><X size={21} /></button>
            </div>

            <form onSubmit={saveAdditionalCourses}>
              <div className="add-courses-student-summary">
                <div>
                  <span>STUDENT</span>
                  <strong>{addCoursesTarget.profiles?.full_name || "Student"}</strong>
                  <small>{addCoursesTarget.profiles?.email || "—"}</small>
                </div>
                <div>
                  <span>CURRENT ENROLLMENT FEE</span>
                  <strong>₹{formatMoney(addCoursesTarget.total_fee)}</strong>
                </div>
                <div>
                  <span>ALREADY PAID</span>
                  <strong>₹{formatMoney(addCoursesTarget.amount_paid)}</strong>
                </div>
              </div>

              <div className="add-courses-picker-heading">
                <strong>Select additional courses / services</strong>
                <span>{additionalCourseIds.length} selected</span>
              </div>

              <div className="enrollment-course-picker add-courses-picker">
                {availableAdditionalCourses.map((course) => (
                  <label className="enrollment-course-option" key={course.id}>
                    <input
                      type="checkbox"
                      checked={additionalCourseIds.includes(course.id)}
                      onChange={(event) => toggleAdditionalCourse(course.id, event.target.checked)}
                    />
                    <span className="enrollment-course-option-name">
                      <strong>{course.title}</strong>
                      <small>{course.category} · {course.duration_weeks || "—"} weeks</small>
                    </span>
                    <span className="enrollment-course-option-price">₹{formatMoney(course.price)}</span>
                  </label>
                ))}
                {availableAdditionalCourses.length === 0 && (
                  <div className="add-courses-empty">All active courses and services are already included in this enrollment.</div>
                )}
              </div>

              {additionalCoursesSelected.length > 0 && (
                <div className="add-courses-batch-section">
                  <div className="enrollment-batch-heading">
                    <h3>Batch Assignment</h3>
                    <p>Assign a batch to each newly added course where applicable.</p>
                  </div>
                  {additionalCoursesSelected.map((course) => {
                    const matchingBatches = batches.filter((batch) => batch.course_id === course.id);
                    return (
                      <div className="enrollment-batch-row" key={course.id}>
                        <div>
                          <strong>{course.title}</strong>
                          <small>{course.course_code}</small>
                        </div>
                        <select
                          value={additionalBatchAssignments[course.id] || ""}
                          onChange={(event) => setAdditionalBatchAssignments((previous) => ({ ...previous, [course.id]: event.target.value }))}
                        >
                          <option value="">No batch assignment</option>
                          {matchingBatches.map((batch) => (
                            <option key={batch.id} value={batch.id}>{batch.batch_name} ({batch.status})</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="add-courses-fee-summary">
                {(() => {
                  const newTotal = Number(addCoursesTarget.total_fee || 0) + additionalCoursesFee;
                  const paid = Number(addCoursesTarget.amount_paid || 0);
                  const pending = Math.max(0, newTotal - paid);
                  return (
                    <>
                      <div><span>Additional fee</span><strong>₹{formatMoney(additionalCoursesFee)}</strong></div>
                      <div><span>New total enrollment fee</span><strong>₹{formatMoney(newTotal)}</strong></div>
                      <div className="add-courses-paid-row"><span>Already paid</span><strong>₹{formatMoney(paid)}</strong></div>
                      <div className="add-courses-pending-row"><span>New pending amount</span><strong>₹{formatMoney(pending)}</strong></div>
                    </>
                  );
                })()}
                <small>Existing verified payments remain unchanged. The pending amount is calculated from the new total fee minus the amount already paid.</small>
              </div>

              {additionalError && <div className="enrollment-modal-error">{additionalError}</div>}

              <div className="enrollment-modal-actions">
                <button type="button" className="enrollment-cancel-button" onClick={closeAddCourses} disabled={additionalSaving}>Cancel</button>
                <button type="submit" className="enrollment-save-button" disabled={additionalSaving || additionalCourseIds.length === 0}>
                  {additionalSaving ? "Adding Courses..." : "Confirm & Add Courses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="enrollment-modal-overlay">
          <div className="enrollment-delete-modal">
            <div className="enrollment-delete-icon"><AlertTriangle size={25} /></div>
            <h2>Delete Enrollment?</h2>
            <p>
              You are about to delete the enrollment for{" "}
              <strong>{deleteTarget.profiles?.full_name || "this student"}</strong>.
              Its course assignments and progress records will also be deleted.
            </p>
            <p className="enrollment-delete-warning">
              This action cannot be undone. Enrollments with payment records cannot be deleted.
            </p>

            {deleteError && <div className="enrollment-modal-error">{deleteError}</div>}

            <div className="enrollment-modal-actions">
              <button className="enrollment-cancel-button" onClick={cancelDelete} disabled={Boolean(deletingId)}>Cancel</button>
              <button className="enrollment-delete-confirm" onClick={confirmDelete} disabled={Boolean(deletingId)}>
                {deletingId ? "Checking..." : "Delete Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
