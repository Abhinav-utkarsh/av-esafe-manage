import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import "./SetPassword.css";

export default function SetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Your invitation link is invalid or expired. Please request a new invitation."
        );
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccessMessage(
        "Your password has been created successfully. Redirecting to your dashboard..."
      );

      setTimeout(() => {
        navigate("/student/dashboard", { replace: true });
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message || "Unable to set your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="set-password-page">
      <div className="set-password-card">
        <div className="set-password-icon">
          <ShieldCheck size={30} />
        </div>

        <h1>Set Your Password</h1>

        <p className="set-password-subtitle">
          Welcome to Av_eSAFE Academy! Create a secure password to access
          your student account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="password">New Password</label>

          <div className="password-input-wrapper">
            <Lock size={18} />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label htmlFor="confirmPassword">Confirm Password</label>

          <div className="password-input-wrapper">
            <Lock size={18} />

            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <p className="password-hint">
            Use at least 8 characters for your password.
          </p>

          {errorMessage && (
            <div className="password-message error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="password-message success">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className="set-password-submit"
            disabled={loading}
          >
            {loading ? "Setting Password..." : "Create Password"}
          </button>
        </form>

        <p className="set-password-footer">
          Av_eSAFE Academy · Secure Student Access
        </p>
      </div>
    </div>
  );
}