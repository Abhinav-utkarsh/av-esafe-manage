
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, LoaderCircle, AlertCircle } from "lucide-react";
import "./LoadingScreen.css";

function LoadingScreen() {
  return (
    <div className="app-loading-screen">
      <div className="loading-content">
        <div className="loading-brand-icon">
          <GraduationCap size={34} />
        </div>

        <h2>Av_eSAFE Academy</h2>

        <p className="loading-subtitle">
          Training Management System
        </p>

        <div className="loading-spinner">
          <LoaderCircle size={30} />
        </div>

        <p className="loading-message">
          Preparing your account...
        </p>

        <div className="loading-progress-track">
          <div className="loading-progress-bar" />
        </div>
      </div>

      <div className="loading-footer">
        © 2026 Av_eSAFE Academy. All rights reserved.
      </div>
    </div>
  );
}

function ProfileErrorScreen() {
  return (
    <div className="app-loading-screen">
      <div className="loading-content">
        <div className="loading-error-icon">
          <AlertCircle size={32} />
        </div>

        <h2>Unable to load profile</h2>

        <p className="loading-message">
          We couldn't load your Academy profile.
          Please contact the administrator.
        </p>
      </div>

      <div className="loading-footer">
        © 2026 Av_eSAFE Academy. All rights reserved.
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  allowedRole
}) {
  const {
    user,
    profile,
    loading,
    accountMessage
  } = useAuth();

  // Display branded loading screen.
  if (loading) {
    return <LoadingScreen />;
  }

  // No authenticated user.
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: accountMessage || ""
        }}
      />
    );
  }

  // Profile could not be loaded.
  if (!profile) {
    return <ProfileErrorScreen />;
  }

  // Block inactive accounts.
  if (profile.account_status !== "active") {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = profile.role === "super_admin";

  const isAdmin =
    profile.role === "admin" ||
    isSuperAdmin;

  // Check permitted role.
  if (allowedRole) {
    let hasAccess = false;

    if (allowedRole === "admin") {
      hasAccess = isAdmin;
    } else if (allowedRole === "super_admin") {
      hasAccess = isSuperAdmin;
    } else {
      hasAccess = profile.role === allowedRole;
    }

    if (!hasAccess) {
      return (
        <Navigate
          to={
            isAdmin
              ? "/admin/dashboard"
              : "/student/dashboard"
          }
          replace
        />
      );
    }
  }

  return children;
}
