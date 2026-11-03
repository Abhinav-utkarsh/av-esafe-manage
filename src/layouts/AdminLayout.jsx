
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  CalendarDays,
  ClipboardList,
  Wallet,
  ChartNoAxesCombined,
  ClipboardCheck,
  Megaphone,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageCircle,
  Check,
  CheckCheck,
  LoaderCircle,
  RefreshCw,
  Archive,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import "./AdminLayout.css";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", path: "/admin/students", icon: Users },
  { label: "Courses", path: "/admin/courses", icon: BookOpen },
  { label: "Bundles", path: "/admin/bundles", icon: Layers },
  { label: "Batches", path: "/admin/batches", icon: CalendarDays },
  { label: "Enrollments", path: "/admin/enrollments", icon: ClipboardList },
  { label: "Payments", path: "/admin/payments", icon: Wallet },
  { label: "Progress", path: "/admin/progress", icon: ChartNoAxesCombined },
  {
    label: "Assessments & Results",
    path: "/admin/assessments",
    icon: ClipboardCheck,
  },
  {
    label: "Announcements",
    path: "/admin/announcements",
    icon: Megaphone,
  },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [updatingMessageId, setUpdatingMessageId] = useState(null);

  const notificationRef = useRef(null);

  const { profile, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch active student messages.
  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);

    try {
      const { data: messages, error } = await supabase
        .from("student_messages")
        .select("id, student_id, message, status, created_at")
        .in("status", ["new", "read"])
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      const studentIds = [
        ...new Set((messages || []).map((item) => item.student_id)),
      ];

      let profilesById = {};

      if (studentIds.length > 0) {
        const { data: students, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds);

        if (profileError) throw profileError;

        profilesById = Object.fromEntries(
          (students || []).map((student) => [student.id, student])
        );
      }

      const formattedMessages = (messages || []).map((item) => ({
        ...item,
        student: profilesById[item.student_id] || null,
      }));

      setNotifications(formattedMessages);

      setUnreadCount(
        formattedMessages.filter((item) => item.status === "new").length
      );
    } catch (error) {
      console.error("Notification loading failed:", error.message);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Initial fetch and Realtime subscription.
  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("admin-student-message-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_messages",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Could not connect to message notifications.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  // Close notification popup when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Update message status.
  const updateMessageStatus = async (messageId, status) => {
    setUpdatingMessageId(messageId);

    try {
      const { error } = await supabase
        .from("student_messages")
        .update({ status })
        .eq("id", messageId);

      if (error) throw error;

      // Remove resolved message immediately from popup.
      if (status === "resolved") {
        setNotifications((previous) =>
          previous.filter((item) => item.id !== messageId)
        );
      }

      await loadNotifications();
    } catch (error) {
      console.error("Message status update failed:", error.message);
      alert(`Could not update message: ${error.message}`);
    } finally {
      setUpdatingMessageId(null);
    }
  };

  // Open resolved queries page.
  const openResolvedQueries = () => {
    setNotificationOpen(false);
    navigate("/admin/resolved-queries");
  };

  // Logout.
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  // Format notification date.
  const formatNotificationDate = (dateValue) => {
    if (!dateValue) return "";

    return new Date(dateValue).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar
          ${collapsed ? "collapsed" : ""}
          ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <GraduationCap size={25} />
          </div>

          {!collapsed && (
            <div className="sidebar-brand-text">
              <strong>Av_eSAFE</strong>
              <span>ACADEMY</span>
            </div>
          )}

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">
          {!collapsed && "MAIN MENU"}
        </div>

        <nav className="sidebar-navigation">
          {/* Standard Admin Navigation */}
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin/dashboard"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : ""}
              >
                <Icon size={19} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}

          {/* Super Admin Only Navigation */}
          {isSuperAdmin && (
            <NavLink
              to="/admin/admin-management"
              end
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
              title={collapsed ? "Admin Management" : ""}
            >
              <ShieldCheck size={19} />
              {!collapsed && <span>Admin Management</span>}
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-collapse-button"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight size={19} />
            ) : (
              <ChevronLeft size={19} />
            )}

            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${collapsed ? "expanded" : ""}`}>
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2>Admin Portal</h2>
              <p>Training Management System</p>
            </div>
          </div>

          <div className="topbar-right">
            {/* Notification Bell */}
            <div
              className="admin-notification-wrapper"
              ref={notificationRef}
            >
              <button
                className={`admin-notification-button ${
                  notificationOpen ? "notification-active" : ""
                }`}
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Open notifications"
                title="Student messages"
              >
                <Bell size={21} />

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="admin-notification-panel">
                  {/* Popup Header */}
                  <div className="notification-panel-header">
                    <div>
                      <h3>Student Messages</h3>
                      <p>
                        {unreadCount} unread{" "}
                        {unreadCount === 1 ? "message" : "messages"}
                      </p>
                    </div>

                    {/* Refresh Button */}
                    <button
                      type="button"
                      className="notification-refresh-button"
                      onClick={loadNotifications}
                      title="Refresh notifications"
                      aria-label="Refresh notifications"
                      disabled={loadingNotifications}
                    >
                      <RefreshCw
                        size={19}
                        strokeWidth={2.3}
                        className={
                          loadingNotifications ? "refresh-spinning" : ""
                        }
                      />
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="notification-list">
                    {loadingNotifications && notifications.length === 0 ? (
                      <div className="notification-empty">
                        <LoaderCircle
                          size={22}
                          className="refresh-spinning"
                        />
                        <p>Loading messages...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-empty">
                        <MessageCircle size={30} />
                        <strong>No active messages</strong>
                        <p>New student queries will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`notification-item ${
                            item.status === "new" ? "unread" : ""
                          }`}
                        >
                          <div className="notification-item-top">
                            <div className="notification-student">
                              <strong>
                                {item.student?.full_name || "Student"}
                              </strong>

                              <span>
                                {item.student?.email || "Email unavailable"}
                              </span>
                            </div>

                            <span
                              className={`notification-status status-${item.status}`}
                            >
                              {item.status === "new" ? "New" : "Read"}
                            </span>
                          </div>

                          <p className="notification-message">
                            {item.message}
                          </p>

                          <span className="notification-date">
                            {formatNotificationDate(item.created_at)}
                          </span>

                          <div className="notification-actions">
                            {item.status === "new" && (
                              <button
                                onClick={() =>
                                  updateMessageStatus(item.id, "read")
                                }
                                disabled={updatingMessageId === item.id}
                              >
                                <Check size={14} />
                                Mark as read
                              </button>
                            )}

                            <button
                              className="resolve-message-button"
                              onClick={() =>
                                updateMessageStatus(item.id, "resolved")
                              }
                              disabled={updatingMessageId === item.id}
                            >
                              <CheckCheck size={14} />
                              Mark resolved
                            </button>
                          </div>

                          {updatingMessageId === item.id && (
                            <span className="notification-updating">
                              Updating...
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Resolved Queries Navigation */}
                  <div className="notification-panel-footer">
                    <button
                      className="notification-resolved-link"
                      onClick={openResolvedQueries}
                    >
                      <Archive size={16} />
                      Resolved Queries
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="admin-profile">
              <div className="admin-avatar">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="admin-profile-info">
                <strong>{profile?.full_name || "Administrator"}</strong>
                <span>
                  {isSuperAdmin ? "Super Administrator" : "Administrator"}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              className="topbar-logout"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
