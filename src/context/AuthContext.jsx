
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react";

import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountMessage, setAccountMessage] = useState("");

  // Load and verify the user's profile and account status.
  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      return null;
    }

    setUser(authUser);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, account_status, deactivated_at"
      )
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.error("Profile loading failed:", error.message);
      setProfile(null);
      return null;
    }

    // Prevent inactive accounts from accessing the application.
    if (data.account_status !== "active") {
      setAccountMessage(
        "Your Academy account is inactive. Please contact the administrator."
      );

      setUser(null);
      setProfile(null);

      await supabase.auth.signOut();

      return null;
    }

    setProfile(data);
    setAccountMessage("");

    return data;
  }, []);

  // Initialize authentication.
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session loading failed:", error.message);
        }

        if (!mounted) return;

        await loadProfile(data?.session?.user ?? null);
      } catch (error) {
        console.error(
          "Authentication initialization failed:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          setProfile(null);
        } else if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          setUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Recheck account status periodically while logged in.
  useEffect(() => {
    if (!user?.id) return;

    let checking = false;

    const verifyAccountStatus = async () => {
      if (checking) return;

      checking = true;

      try {
        await loadProfile(user);
      } catch (error) {
        console.error(
          "Account status verification failed:",
          error
        );
      } finally {
        checking = false;
      }
    };

    const intervalId = window.setInterval(
      verifyAccountStatus,
      30000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.id, loadProfile]);

  // Manually refresh profile.
  const refreshProfile = async () => {
    if (!user) return null;

    return await loadProfile(user);
  };

  // Logout.
  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
    setProfile(null);
  };

  // Role-based permissions.
  const isSuperAdmin = profile?.role === "super_admin";

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "super_admin";

  const isStudent = profile?.role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        accountMessage,

        isSuperAdmin,
        isAdmin,
        isStudent,

        loadProfile,
        refreshProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
