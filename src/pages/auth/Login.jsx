
import "./Login.css";

import {
  GraduationCap,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const { loadProfile } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      // Step 2: Load the user's database profile
      const loadedProfile = await loadProfile(data.user);

      if (!loadedProfile) {
        throw new Error(
          "Unable to load your account profile. Please contact the administrator."
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, account_status")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        throw new Error(
          "Your account profile was not found. Please contact the administrator."
        );
      }

      // Step 3: Verify account status
      if (profile.account_status !== "active") {
        await supabase.auth.signOut();

        throw new Error(
          "Your account is inactive. Please contact the administrator."
        );
      }

      // Step 4: Redirect based on role
      if (
        profile.role === "admin" ||
        profile.role === "super_admin"
      ) {
        navigate("/admin/dashboard", { replace: true });
      } else if (profile.role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else {
        await supabase.auth.signOut();

        throw new Error(
          "Your account does not have a valid role."
        );
      }

    } catch (error) {
      console.error("Login failed:", error);

      setErrorMessage(
        error.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Left Branding Section */}
      <div className="login-brand-section">

        <div className="brand-logo">
          <div className="brand-icon">
            <GraduationCap size={30} />
          </div>
          <span>Av_eSAFE Academy</span>
        </div>

        <div className="brand-content">

          <span className="brand-tag">
            LEARN. GROW. SUCCEED.
          </span>

          <h1>
            Your learning journey
            <span> starts here.</span>
          </h1>

          <p>
            A smarter way to learn, track your progress
            and achieve your career goals with Av_eSAFE Academy.
          </p>

          <div className="brand-features">

            <div>
              <ShieldCheck size={19} />
              Secure Learning Environment
            </div>

            <div>
              <GraduationCap size={19} />
              Structured Training Programs
            </div>

          </div>

        </div>

        <div className="brand-footer">
          © 2026 Av_eSAFE Academy. All rights reserved.
        </div>

      </div>

      {/* Right Login Section */}
      <div className="login-form-section">

        <div className="login-form-container">

          <div className="mobile-brand">
            <GraduationCap size={32} />
            <span>Av_eSAFE Academy</span>
          </div>

          <div className="login-heading">

            <span className="welcome-label">
              WELCOME BACK
            </span>

            <h2>Sign in to your account</h2>

            <p>
              Enter your credentials to access your dashboard.
            </p>

          </div>

          <form className="login-form" onSubmit={handleLogin}>

            <div className="form-group">

              <label htmlFor="login-email">Email Address</label>

              <div className="input-wrapper">
                <Mail size={19} />

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

            </div>

            <div className="form-group">

              <label htmlFor="login-password">Password</label>

              <div className="input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                  }
                </button>

              </div>

            </div>

            {errorMessage && (
              <div className="login-error" role="alert">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}

              {!loading && <ArrowRight size={19} />}
            </button>

          </form>

          <div className="login-security">

            <ShieldCheck size={18} />

            <span>
              Secure access for authorized students and administrators.
            </span>

          </div>

          <div className="login-bottom">
            Powered by Av_eSAFE
          </div>

        </div>

      </div>

    </div>
  );
}
