
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthContext } from "./AuthContext";

import {
  loginUser,
  registerUser,
} from "../services/authService";

function getStoredSession() {
  try {
    const token = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    if (!token || !storedUser) {
      return { user: null, token: null };
    }

    return {
      user: JSON.parse(storedUser),
      token,
    };
  } catch {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession);
  const [loading, setLoading] = useState(false);

  const saveSession = useCallback((data) => {
    if (!data?.token || !data?.user) {
      throw new Error(
        "The server returned an invalid authentication response."
      );
    }

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setSession({
      user: data.user,
      token: data.token,
    });
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setSession({
      user: null,
      token: null,
    });
  }, []);

  const login = useCallback(
    async (credentials) => {
      setLoading(true);

      try {
        const data = await loginUser(credentials);
        saveSession(data);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const register = useCallback(
    async (userData) => {
      setLoading(true);

      try {
        const data = await registerUser(userData);
        saveSession(data);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    function handleUnauthorized() {
      clearSession();
    }

    window.addEventListener(
      "auth:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "auth:unauthorized",
        handleUnauthorized
      );
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(
        session.user && session.token
      ),
      loading,
      login,
      register,
      logout,
    }),
    [session, loading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
