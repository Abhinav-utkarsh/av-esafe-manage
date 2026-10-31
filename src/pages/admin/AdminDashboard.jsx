
import { useEffect, useState, useCallback } from "react";

import {
  Users,
  BookOpen,
  CalendarDays,
  Wallet,
  ClipboardList,
  TrendingUp,
  RefreshCw
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

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  const fetchDashboardStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError("");

    try {
      const [
        studentsResult,
        coursesResult,
        batchesResult,
        paymentsResult
      ] = await Promise.all([
        // Total registered students
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student"),

        // Active courses
        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),

        // Ongoing batches
        supabase
          .from("batches")
          .select("*", { count: "exact", head: true })
          .eq("status", "ongoing"),

        // Payments awaiting verification
        supabase
          .from("payments")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "pending")
      ]);

      const results = [
        studentsResult,
        coursesResult,
        batchesResult,
        paymentsResult
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        throw failedResult.error;
      }

      setStats({
        students: studentsResult.count ?? 0,
        courses: coursesResult.count ?? 0,
        batches: batchesResult.count ?? 0,
        payments: paymentsResult.count ?? 0
      });

    } catch (error) {
      console.error("Dashboard statistics error:", error);
      setStatsError("Unable to load dashboard statistics.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

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

  return (
    <div className="dashboard-page">

      {/* Dashboard Welcome */}
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
          onClick={fetchDashboardStats}
          disabled={loadingStats}
          title="Refresh dashboard statistics"
        >
          <RefreshCw
            size={16}
            className={loadingStats ? "refresh-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      {statsError && (
        <div className="dashboard-error">
          {statsError}
          <button onClick={fetchDashboardStats}>
            Try again
          </button>
        </div>
      )}

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

      {/* Bottom Dashboard Sections */}
      <div className="dashboard-bottom-grid">

        <div className="dashboard-panel">

          <div className="panel-heading">
            <h3>Recent Activity</h3>
            <TrendingUp size={19} />
          </div>

          <div className="empty-dashboard">
            <ClipboardList size={30} />

            <p>No recent activity yet.</p>

            <span>
              Student enrollments and payment updates
              will appear here.
            </span>
          </div>

        </div>

        <div className="dashboard-panel">

          <div className="panel-heading">
            <h3>Academy Overview</h3>
            <BookOpen size={19} />
          </div>

          <div className="overview-message">

            <h4>
              Manage your academy in one place.
            </h4>

            <p>
              Manage students, training services, bundles,
              batches, enrollments and payments from the sidebar.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
