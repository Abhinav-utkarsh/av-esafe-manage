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

// ==========================================
// PUBLIC PAGES
// ==========================================

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Founder from "./pages/public/Founder";
import OurMentors from "./pages/public/OurMentors";
import ScrollToTop from "./components/ScrollToTop";
import Chatbot from "./components/Chatbot";

// ==========================================
// PUBLIC NAVBAR & FOOTER
// ==========================================

import Navbar from "./components/public/Navbar";
import Footer from "./components/public/Footer";

// ==========================================
// AUTHENTICATION & PROTECTED ROUTES
// ==========================================

import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider, useAuth } from "./context/AuthContext";

// ==========================================
// LAYOUTS
// ==========================================

import AdminLayout from "./layouts/AdminLayout";

// ==========================================
// ADMIN PAGES
// ==========================================

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

// NEW: STUDENT APPLICATIONS

import StudentApplications from "./pages/admin/StudentApplications";

// ==========================================
// STUDENT PAGES
// ==========================================

import StudentDashboard from "./pages/student/StudentDashboard";

// ==========================================
// CSS
// ==========================================

import "./components/LoadingScreen.css";

// ==========================================
// PUBLIC LAYOUT
// ==========================================

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

// ==========================================
// APP LOADING SCREEN
// ==========================================

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

// ==========================================
// APPLICATION ROUTES
// ==========================================



function AppRoutes() {
  const { user, profile, loading } = useAuth();

  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 800);

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
    <>
      {/* GLOBAL SCROLL TO TOP */}
      <ScrollToTop />

      {/* GLOBAL AV_eSAFE AI CHATBOT */}
      <Chatbot />

      <Routes>
        {/* PUBLIC HOMEPAGE */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* ABOUT US */}
        <Route
          path="/about"
          element={<About />}
        />

        {/* FOUNDER */}
        <Route
          path="/founder"
          element={<Founder />}
        />

        {/* OUR MENTORS */}
        <Route
          path="/our-mentors"
          element={<OurMentors />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            <PublicLayout>
              {user ? (
                isAdmin ? (
                  <Navigate
                    to="/admin/dashboard"
                    replace
                  />
                ) : isStudent ? (
                  <Navigate
                    to="/student/dashboard"
                    replace
                  />
                ) : (
                  <Login />
                )
              ) : (
                <Login />
              )}
            </PublicLayout>
          }
        />

        {/* SET PASSWORD */}
        <Route
          path="/set-password"
          element={<SetPassword />}
        />

        {/* ====================================== */}
        {/* ADMIN ROUTES */}
        {/* ====================================== */}

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
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* ADMIN DASHBOARD */}
          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          {/* STUDENTS */}
          <Route
            path="students"
            element={<Students />}
          />

          {/* STUDENT APPLICATIONS */}
          <Route
            path="student-applications"
            element={<StudentApplications />}
          />

          {/* COURSES */}
          <Route
            path="courses"
            element={<Courses />}
          />

          {/* BUNDLES */}
          <Route
            path="bundles"
            element={<Bundles />}
          />

          {/* BATCHES */}
          <Route
            path="batches"
            element={<Batches />}
          />

          {/* ENROLLMENTS */}
          <Route
            path="enrollments"
            element={<Enrollments />}
          />

          {/* PAYMENTS */}
          <Route
            path="payments"
            element={<Payments />}
          />

          {/* PROGRESS */}
          <Route
            path="progress"
            element={<Progress />}
          />

          {/* ASSESSMENTS */}
          <Route
            path="assessments"
            element={<Assessments />}
          />

          {/* ANNOUNCEMENTS */}
          <Route
            path="announcements"
            element={<Announcements />}
          />

          {/* RESOLVED QUERIES */}
          <Route
            path="resolved-queries"
            element={<ResolvedQueries />}
          />

          {/* ADMIN MANAGEMENT */}
          <Route
            path="admin-management"
            element={
              <ProtectedRoute allowedRole="super_admin">
                <AdminManagement />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ====================================== */}
        {/* STUDENT ROUTES */}
        {/* ====================================== */}

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* ====================================== */}
        {/* FALLBACK ROUTE */}
        {/* ====================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </>
  );
}



// ==========================================
// ROOT APPLICATION
// ==========================================

export default function App() {
  useEffect(() => {
    const style = document.createElement("style");

    style.id = "av-esafe-hide-scrollbars";

    style.textContent = `
      html,
      body,
      #root,
      #root * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      #root::-webkit-scrollbar,
      #root *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(
        "av-esafe-hide-scrollbars"
      );

      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}