import {
  useEffect,
  useState,
} from "react";

import { AuthContext } from "./auth-context";

import {
  loginUser,
  registerUser,
} from "../services/authService";

function clearStoredSession() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("expiresAt");
}

function getStoredSession() {
  const token = sessionStorage.getItem("token");
  const userJSON = sessionStorage.getItem("user");
  const expiresAt = Number(sessionStorage.getItem("expiresAt"));

  if (!token || !userJSON || !expiresAt) {
    return null;
  }

  if (Date.now() >= expiresAt) {
    clearStoredSession();
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(userJSON),
      expiresAt,
    };
  } catch {
    clearStoredSession();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession);
  const [loading, setLoading] = useState(false);

  function saveSession(data) {
    const expiresIn = Number(data.expiresIn);

    if (!data.token || !data.user || !expiresIn) {
      throw new Error("Invalid authentication response.");
    }

    const expiresAt = Date.now() + expiresIn * 1000;

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    sessionStorage.setItem("expiresAt", String(expiresAt));

    setSession({
      token: data.token,
      user: data.user,
      expiresAt,
    });
  }

  async function register(formData) {
    setLoading(true);

    try {
      const data = await registerUser(formData);
      saveSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function login(credentials) {
    setLoading(true);

    try {
      const data = await loginUser(credentials);
      saveSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearStoredSession();
    setSession(null);
  }

  // Synchronize the session with its expiration timer.
  useEffect(() => {
    if (!session) return;

    const remainingTime = session.expiresAt - Date.now();

    const timer = setTimeout(() => {
      clearStoredSession();
      setSession(null);
    }, Math.max(remainingTime, 0));

    return () => clearTimeout(timer);
  }, [session]);

  const value = {
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session),
    loading,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}