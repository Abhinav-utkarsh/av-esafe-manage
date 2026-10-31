
import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  CalendarDays,
  Mail,
  User,
  AlertCircle
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import "./ResolvedQueries.css";

export default function ResolvedQueries() {
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const loadResolvedMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: messageData, error: messageError } = await supabase
        .from("student_messages")
        .select("id, student_id, message, status, created_at, updated_at")
        .eq("status", "resolved")
        .order("created_at", { ascending: false });

      if (messageError) throw messageError;

      const studentIds = [
        ...new Set((messageData || []).map((item) => item.student_id))
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

      const formattedMessages = (messageData || []).map((item) => ({
        ...item,
        student: profilesById[item.student_id] || null
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error("Resolved messages loading failed:", err.message);
      setError(err.message || "Unable to load resolved messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResolvedMessages();

    const channel = supabase
      .channel("resolved-queries-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_messages"
        },
        () => {
          loadResolvedMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadResolvedMessages]);

  const handleDelete = async (message) => {
    const studentName = message.student?.full_name || "this student";

    const confirmed = window.confirm(
      `Permanently delete this resolved message from ${studentName}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(message.id);
    setError("");

    try {
      const { data, error: deleteError } = await supabase
        .from("student_messages")
        .delete()
        .eq("id", message.id)
        .eq("status", "resolved")
        .select("id");

      if (deleteError) throw deleteError;

      if (!data || data.length === 0) {
        throw new Error(
          "The message was not deleted. Please check your Admin permissions."
        );
      }

      setMessages((previous) =>
        previous.filter((item) => item.id !== message.id)
      );
    } catch (err) {
      console.error("Message deletion failed:", err.message);
      setError(err.message || "Unable to delete this message.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMessages = messages.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    const studentName = item.student?.full_name || "";
    const studentEmail = item.student?.email || "";

    return (
      studentName.toLowerCase().includes(search) ||
      studentEmail.toLowerCase().includes(search) ||
      item.message.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    return new Date(dateValue).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="resolved-queries-page">

      {/* PAGE HEADER */}
      <div className="resolved-page-header">
        <div>
          <div className="resolved-title-row">
            <div className="resolved-title-icon">
              <MessageCircle size={23} />
            </div>

            <div>
              <h1>Resolved Queries</h1>
              <p>
                View and manage previously resolved student messages.
              </p>
            </div>
          </div>
        </div>

        <button
          className="resolved-refresh-button"
          onClick={loadResolvedMessages}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "resolved-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="resolved-summary-card">
        <div className="resolved-summary-icon">
          <CheckCircle2 size={23} />
        </div>

        <div>
          <span>Total Resolved Messages</span>
          <strong>{messages.length}</strong>
        </div>
      </div>

      {/* SEARCH */}
      <div className="resolved-search-wrapper">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search by student name, email or message..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {/* ERROR */}
      {error && (
        <div className="resolved-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* MESSAGES */}
      <div className="resolved-messages-section">

        <div className="resolved-section-header">
          <div>
            <h2>Archived Messages</h2>
            <p>
              {filteredMessages.length} message
              {filteredMessages.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="resolved-empty-state">
            <RefreshCw size={28} className="resolved-spinning" />
            <p>Loading resolved messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="resolved-empty-state">
            <MessageCircle size={36} />

            <strong>
              {searchTerm
                ? "No matching messages found"
                : "No resolved messages yet"}
            </strong>

            <p>
              {searchTerm
                ? "Try searching with a different name, email or keyword."
                : "Messages marked as resolved will appear here."}
            </p>
          </div>
        ) : (
          <div className="resolved-message-list">

            {filteredMessages.map((item) => (
              <article
                className="resolved-message-card"
                key={item.id}
              >

                <div className="resolved-message-card-header">

                  <div className="resolved-student-info">
                    <div className="resolved-student-avatar">
                      {(item.student?.full_name || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3>
                        {item.student?.full_name || "Student"}
                      </h3>

                      <div className="resolved-student-email">
                        <Mail size={13} />
                        <span>
                          {item.student?.email || "Email unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="resolved-status-badge">
                    <CheckCircle2 size={13} />
                    Resolved
                  </span>

                </div>

                <div className="resolved-message-content">
                  <p>{item.message}</p>
                </div>

                <div className="resolved-message-footer">

                  <div className="resolved-message-date">
                    <CalendarDays size={14} />
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  <button
                    className="resolved-delete-button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <RefreshCw size={15} className="resolved-spinning" />
                    ) : (
                      <Trash2 size={15} />
                    )}

                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}
