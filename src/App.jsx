
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GraduationCap, LoaderCircle } from "lucide-react";

import Login from "./pages/auth/Login";
import SetPassword from "./pages/auth/SetPassword";

import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider, useAuth } from "./context/AuthContext";

import AdminLayout from "./layouts/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import Courses from "./pages/admin/Courses";
import Bundles from "./pages/admin/Bundles";
import Batches from "./pages/admin/Batches";
import Enrollments from "./pages/admin/Enrollments";
import Payments from "./pages/admin/Payments";
import Progress from "./pages/admin/Progress";
import ResolvedQueries from "./pages/admin/ResolvedQueries";
import AdminManagement from "./pages/admin/AdminManagement";
import Assessments from "./pages/admin/Assessments";
import Announcements from "./pages/admin/Announcements";

import StudentDashboard from "./pages/student/StudentDashboard";

import "./components/LoadingScreen.css";

function AppLoadingScreen() {
  return (
    <div className="app-loading-screen">
      <div className="loading-content">
        <div className="loading-brand-icon">
          <GraduationCap size={38} />
        </div>

        <h1>Av_eSAFE Academy</h1>

        <p className="loading-subtitle">
          Learning Today. Leading Tomorrow.
        </p>

        <div className="loading-spinner">
          <LoaderCircle size={30} />
        </div>

        <p className="loading-message">
          Preparing your learning experience...
        </p>

        <div className="loading-progress-track">
          <div className="loading-progress-bar"></div>
        </div>

        <p className="loading-footer">
          Please wait while we get things ready.
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  // Keep loading screen visible for at least 3 seconds.
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading || showLoading) {
    return <AppLoadingScreen />;
  }

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "super_admin";

  const isStudent = profile?.role === "student";

  return (
    <Routes>
      {/* Root Route */}
      <Route
        path="/"
        element={
          user ? (
            isAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : isStudent ? (
              <Navigate to="/student/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          user ? (
            isAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : isStudent ? (
              <Navigate to="/student/dashboard" replace />
            ) : (
              <Login />
            )
          ) : (
            <Login />
          )
        }
      />

      {/* Set Password */}
      <Route path="/set-password" element={<SetPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="courses" element={<Courses />} />
        <Route path="bundles" element={<Bundles />} />
        <Route path="batches" element={<Batches />} />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="payments" element={<Payments />} />
        <Route path="progress" element={<Progress />} />

        {/* Assessments & Results */}
        <Route path="assessments" element={<Assessments />} />

        {/* Announcements & Approval */}
        <Route path="announcements" element={<Announcements />} />

        <Route
          path="resolved-queries"
          element={<ResolvedQueries />}
        />

        {/* Super Admin Only */}
        <Route
          path="admin-management"
          element={
            <ProtectedRoute allowedRole="super_admin">
              <AdminManagement />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
