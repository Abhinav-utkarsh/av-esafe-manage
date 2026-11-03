
import { useEffect, useState, useCallback } from "react";

import {
  Users,
  BookOpen,
  CalendarDays,
  Wallet,
  RefreshCw,
  Trophy,
  Activity,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  UserPlus,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock3,
  X,
  Eye,
  ChevronRight
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { profile } = useAuth();

  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    batches: 0,
    payments: 0
  });

  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [overview, setOverview] = useState({
    totalEnrollments: 0,
    completedCourses: 0,
    averageScore: 0
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [showActivityModal, setShowActivityModal] = useState(false);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    return new Date(dateValue).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTimeAgo = (dateValue) => {
    if (!dateValue) return "";

    const now = new Date();
    const date = new Date(dateValue);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;

    return formatDate(dateValue);
  };

  const getActivityIcon = (entityType, action) => {
    const type = (entityType || "").toLowerCase();

    if (type.includes("payment")) return CreditCard;
    if (type.includes("assessment")) return ClipboardCheck;
    if (type.includes("enrollment")) return GraduationCap;
    if (type.includes("profile")) return Users;
    if (type.includes("batch")) return CalendarDays;
    if (type.includes("course")) return BookOpen;
    if (type.includes("bundle")) return BookOpen;
    if (type.includes("message")) return Activity;

    if (action === "created") return UserPlus;
    return Activity;
  };

  const getActivityColor = (entityType, action) => {
    const type = (entityType || "").toLowerCase();

    if (type.includes("payment")) return "green";
    if (type.includes("assessment")) return "purple";
    if (type.includes("enrollment")) return "blue";
    if (action === "deleted") return "red";
    if (action === "created") return "blue";

    return "orange";
  };

  const getActionLabel = (action) => {
    const labels = {
      created: "Created",
      updated: "Updated",
      deleted: "Deleted"
    };

    return labels[action] || action || "Activity";
  };

  const fetchDashboardData = useCallback(async () => {
    setLoadingStats(true);
    setStatsError("");

    try {
      const [
        studentsResult,
        coursesResult,
        batchesResult,
        pendingPaymentsResult,
        profilesResult,
        enrollmentsResult,
        paymentsResult,
        assessmentsResult,
        enrollmentItemsResult,
        activityResult
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student"),

        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),

        supabase
          .from("batches")
          .select("*", { count: "exact", head: true })
          .eq("status", "ongoing"),

        supabase
          .from("payments")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "pending"),

        supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "student"),

        supabase
          .from("enrollments")
          .select(
            "id, student_id, enrollment_date, enrollment_status, payment_status, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("payments")
          .select(
            "id, enrollment_id, amount, payment_status, payment_date, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("student_assessment_results")
          .select(
            "id, student_id, assessment_name, assessment_type, assessment_date, marks_obtained, maximum_marks, percentage, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("enrollment_items")
          .select("id, enrollment_id, item_status, progress_percentage"),

        supabase
          .from("admin_activity_logs")
          .select(
            "id, actor_id, action, entity_type, entity_id, description, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(30)
      ]);

      const results = [
        studentsResult,
        coursesResult,
        batchesResult,
        pendingPaymentsResult,
        profilesResult,
        enrollmentsResult,
        paymentsResult,
        assessmentsResult,
        enrollmentItemsResult,
        activityResult
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        throw failedResult.error;
      }

      const students = profilesResult.data || [];
      const enrollments = enrollmentsResult.data || [];
      const payments = paymentsResult.data || [];
      const assessments = assessmentsResult.data || [];
      const enrollmentItems = enrollmentItemsResult.data || [];
      const activityLogs = activityResult.data || [];

      const studentMap = new Map(
        students.map((student) => [student.id, student])
      );

      const enrollmentMap = new Map(
        enrollments.map((enrollment) => [
          enrollment.id,
          enrollment
        ])
      );

      // ------------------------------------------
      // 1. DASHBOARD STATISTICS
      // ------------------------------------------

      setStats({
        students: studentsResult.count ?? 0,
        courses: coursesResult.count ?? 0,
        batches: batchesResult.count ?? 0,
        payments: pendingPaymentsResult.count ?? 0
      });

      // ------------------------------------------
      // 2. TOP 3 STUDENT PERFORMERS
      // ------------------------------------------

      const performanceMap = new Map();

      assessments.forEach((assessment) => {
        if (!assessment.student_id) return;

        const marks = Number(assessment.marks_obtained);
        const maximum = Number(assessment.maximum_marks);

        const percentage =
          assessment.percentage !== null &&
          assessment.percentage !== undefined
            ? Number(assessment.percentage)
            : maximum > 0
              ? (marks / maximum) * 100
              : null;

        if (percentage === null || !Number.isFinite(percentage)) {
          return;
        }

        if (!performanceMap.has(assessment.student_id)) {
          performanceMap.set(assessment.student_id, {
            studentId: assessment.student_id,
            totalPercentage: 0,
            assessmentCount: 0
          });
        }

        const record = performanceMap.get(assessment.student_id);

        record.totalPercentage += percentage;
        record.assessmentCount += 1;
      });

      const performers = Array.from(performanceMap.values())
        .map((record) => {
          const student = studentMap.get(record.studentId);

          return {
            ...record,
            name: student?.full_name || "Unknown Student",
            email: student?.email || "",
            averageScore:
              record.totalPercentage / record.assessmentCount
          };
        })
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 3);

      setTopPerformers(performers);

      // ------------------------------------------
      // 3. RECENT ACTIVITY WITH ADMIN NAMES
      // ------------------------------------------

      const actorIds = [
        ...new Set(
          activityLogs
            .map((log) => log.actor_id)
            .filter(Boolean)
        )
      ];

      let adminMap = new Map();

      if (actorIds.length > 0) {
        const { data: actorProfiles, error: actorError } =
          await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", actorIds);

        if (actorError) throw actorError;

        adminMap = new Map(
          (actorProfiles || []).map((actor) => [
            actor.id,
            actor
          ])
        );
      }

      const formattedActivities = activityLogs.map((log) => {
        const actor = adminMap.get(log.actor_id);

        return {
          ...log,
          adminName: actor?.full_name || "System / Unknown",
          adminEmail: actor?.email || "",
          icon: getActivityIcon(log.entity_type, log.action),
          color: getActivityColor(log.entity_type, log.action)
        };
      });

      setRecentActivities(formattedActivities);

      // ------------------------------------------
      // 4. ACADEMY OVERVIEW
      // ------------------------------------------

      const completedCourses = enrollmentItems.filter(
        (item) => item.item_status === "completed"
      ).length;

      const validScores = assessments
        .map((assessment) => {
          if (
            assessment.percentage !== null &&
            assessment.percentage !== undefined
          ) {
            return Number(assessment.percentage);
          }

          const marks = Number(assessment.marks_obtained);
          const maximum = Number(assessment.maximum_marks);

          return maximum > 0 ? (marks / maximum) * 100 : null;
        })
        .filter(
          (score) =>
            score !== null &&
            Number.isFinite(score)
        );

      const averageScore =
        validScores.length > 0
          ? validScores.reduce((sum, score) => sum + score, 0) /
            validScores.length
          : 0;

      setOverview({
        totalEnrollments: enrollments.length,
        completedCourses,
        averageScore
      });

    } catch (error) {
      console.error("Dashboard data error:", error);
      setStatsError(
        error.message || "Unable to load dashboard information."
      );
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Close activity popup using Escape key.
  useEffect(() => {
    if (!showActivityModal) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowActivityModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showActivityModal]);

  const statCards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: Users,
      description: "Registered students"
    },
    {
      title: "Active Courses",
      value: stats.courses,
      icon: BookOpen,
      description: "Available courses"
    },
    {
      title: "Active Batches",
      value: stats.batches,
      icon: CalendarDays,
      description: "Ongoing batches"
    },
    {
      title: "Pending Payments",
      value: stats.payments,
      icon: Wallet,
      description: "Awaiting verification"
    }
  ];

  const getRankLabel = (index) => {
    if (index === 0) return "1st";
    if (index === 1) return "2nd";
    return "3rd";
  };

  const renderActivityItem = (activity, compact = false) => {
    const Icon = activity.icon;

    return (
      <div
        className={`dashboard-activity-item ${
          compact ? "activity-item-compact" : ""
        }`}
        key={activity.id}
      >
        <div className={`activity-icon activity-${activity.color}`}>
          <Icon size={compact ? 15 : 17} />
        </div>

        <div className="activity-content">
          <div className="activity-title-row">
            <h4>{activity.description}</h4>

            <span
              className={`activity-action activity-action-${activity.action}`}
            >
              {getActionLabel(activity.action)}
            </span>
          </div>

          <p>
            <strong>By:</strong> {activity.adminName}
          </p>

          <span className="activity-time">
            <Clock3 size={11} />
            {getTimeAgo(activity.created_at)}
            {!compact && ` · ${formatDateTime(activity.created_at)}`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">

      {/* Welcome Section */}

      <div className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">
            OVERVIEW
          </span>

          <h1>
            Welcome back, {profile?.full_name || "Admin"}!
          </h1>

          <p>
            Here's what's happening with your training academy.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={fetchDashboardData}
          disabled={loadingStats}
          title="Refresh dashboard"
        >
          <RefreshCw
            size={16}
            className={loadingStats ? "refresh-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error Message */}

      {statsError && (
        <div className="dashboard-error">
          {statsError}

          <button onClick={fetchDashboardData}>
            Try again
          </button>
        </div>
      )}

      {/* Statistics Cards */}

      <div className="dashboard-stats">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="dashboard-stat-card"
              key={stat.title}
            >
              <div className="stat-card-top">
                <div className="stat-icon">
                  <Icon size={21} />
                </div>
              </div>

              <h2>
                {loadingStats ? "..." : stat.value}
              </h2>

              <h3>{stat.title}</h3>

              <p>{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Top 3 Student Performers */}

      <section className="dashboard-performers-panel">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-eyebrow">
              STUDENT ACHIEVEMENTS
            </span>

            <h3>
              <Trophy size={18} />
              Top 3 Student Performers
            </h3>

            <p>
              Ranked by average assessment score.
            </p>
          </div>

          <Award size={21} className="dashboard-heading-icon" />
        </div>

        {loadingStats ? (
          <div className="dashboard-section-loading">
            Loading student performance...
          </div>
        ) : topPerformers.length === 0 ? (
          <div className="dashboard-empty-state">
            <GraduationCap size={30} />

            <h4>No assessment results yet</h4>

            <p>
              Rankings will appear after assessment results
              are added.
            </p>
          </div>
        ) : (
          <div className="dashboard-performers-grid">
            {topPerformers.map((student, index) => (
              <div
                className={`dashboard-performer-card rank-${index + 1}`}
                key={student.studentId}
              >
                <div className="performer-card-top">
                  <span className="performer-rank">
                    {getRankLabel(index)}
                  </span>

                  <Trophy size={17} />
                </div>

                <div className="performer-avatar">
                  {(student.name || "S")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <h4>{student.name}</h4>

                <p className="performer-email">
                  {student.email || "Email unavailable"}
                </p>

                <div className="performer-score">
                  <strong>
                    {student.averageScore.toFixed(1)}%
                  </strong>

                  <span>Average score</span>
                </div>

                <div className="performer-footer">
                  <ClipboardCheck size={13} />

                  {student.assessmentCount} assessment
                  {student.assessmentCount === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity and Academy Overview */}

      <div className="dashboard-bottom-grid">

        {/* Recent Activity */}

        <section className="dashboard-panel dashboard-activity-panel">
          <div className="panel-heading">
            <div>
              <h3>
                <Activity size={18} />
                Recent Activity
              </h3>

              <p>Latest 3 changes made in the academy.</p>
            </div>

            <TrendingUp size={19} />
          </div>

          {loadingStats ? (
            <div className="dashboard-section-loading">
              Loading recent activity...
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="dashboard-empty-state">
              <Clock3 size={30} />

              <h4>No recent activity</h4>

              <p>
                Admin changes will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="dashboard-activity-list">
                {recentActivities
                  .slice(0, 3)
                  .map((activity) =>
                    renderActivityItem(activity, true)
                  )}
              </div>

              <div className="activity-view-more">
                <span>
                  Showing {Math.min(3, recentActivities.length)} of{" "}
                  {recentActivities.length} activities
                </span>

                <button
                  type="button"
                  onClick={() => setShowActivityModal(true)}
                >
                  <Eye size={14} />
                  View more
                  <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}
        </section>

        {/* Academy Overview */}

        <section className="dashboard-panel dashboard-overview-panel">
          <div className="panel-heading">
            <div>
              <h3>
                <BookOpen size={18} />
                Academy Overview
              </h3>

              <p>A quick look at academy performance.</p>
            </div>

            <TrendingUp size={19} />
          </div>

          <div className="academy-overview-content">

            <div className="academy-overview-card">
              <div className="academy-overview-icon overview-blue">
                <Users size={19} />
              </div>

              <div>
                <span>Total Enrollments</span>

                <strong>
                  {loadingStats ? "..." : overview.totalEnrollments}
                </strong>
              </div>
            </div>

            <div className="academy-overview-card">
              <div className="academy-overview-icon overview-green">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>Completed Course Enrollments</span>

                <strong>
                  {loadingStats ? "..." : overview.completedCourses}
                </strong>
              </div>
            </div>

            <div className="academy-overview-card">
              <div className="academy-overview-icon overview-purple">
                <Award size={19} />
              </div>

              <div>
                <span>Average Assessment Score</span>

                <strong>
                  {loadingStats
                    ? "..."
                    : `${overview.averageScore.toFixed(1)}%`}
                </strong>
              </div>
            </div>

          </div>

          <div className="academy-overview-note">
            <GraduationCap size={17} />

            <p>
              Monitor student enrollment, course completion
              and assessment performance from one place.
            </p>
          </div>
        </section>

      </div>

      {/* Recent Activity Popup */}

      {showActivityModal && (
        <div
          className="activity-modal-overlay"
          onClick={() => setShowActivityModal(false)}
        >
          <div
            className="activity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="activity-modal-header">
              <div>
                <span className="dashboard-section-eyebrow">
                  ACADEMY AUDIT HISTORY
                </span>

                <h2 id="activity-modal-title">
                  Recent Activity
                </h2>

                <p>
                  Latest {recentActivities.length} recorded changes.
                </p>
              </div>

              <button
                type="button"
                className="activity-modal-close"
                onClick={() => setShowActivityModal(false)}
                aria-label="Close activity history"
              >
                <X size={20} />
              </button>
            </div>

            <div className="activity-modal-toolbar">
              <span>
                <Activity size={14} />
                Maximum 30 records retained
              </span>

              <button
                type="button"
                onClick={fetchDashboardData}
                disabled={loadingStats}
              >
                <RefreshCw
                  size={13}
                  className={loadingStats ? "refresh-spinning" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="activity-modal-body">
              {loadingStats ? (
                <div className="dashboard-section-loading">
                  Loading activity history...
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="dashboard-empty-state">
                  <Clock3 size={32} />

                  <h4>No activity records</h4>

                  <p>
                    Admin changes will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="dashboard-activity-list modal-activity-list">
                  {recentActivities.map((activity) => (
                    <div
                      className="modal-activity-record"
                      key={activity.id}
                    >
                      {renderActivityItem(activity, false)}

                      <div className="modal-activity-details">
                        <span>
                          <strong>Admin:</strong>{" "}
                          {activity.adminName}
                        </span>

                        {activity.adminEmail && (
                          <span>{activity.adminEmail}</span>
                        )}

                        <span>
                          <strong>Date:</strong>{" "}
                          {formatDateTime(activity.created_at)}
                        </span>

                        <span>
                          <strong>Module:</strong>{" "}
                          {activity.entity_type || "General"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="activity-modal-footer">
              <span>
                Displaying {recentActivities.length} of 30 maximum records
              </span>

              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
