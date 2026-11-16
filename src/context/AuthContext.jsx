import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
} from "../services/authService";

const AuthContext = createContext(null);

function getStoredSession() {
  const token = sessionStorage.getItem("token");
  const userJSON = sessionStorage.getItem("user");
  const expiresAt = Number(sessionStorage.getItem("expiresAt"));

  if (!token || !userJSON || !expiresAt) {
    return null;
  }

  // Do not restore an already expired session.
  if (Date.now() >= expiresAt) {
    sessionStorage.clear();
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(userJSON),
      expiresAt,
    };
  } catch {
    sessionStorage.clear();
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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("expiresAt");

    setSession(null);
  }

  // Automatically end the local session when its expiry time arrives.
  useEffect(() => {
    if (!session) return;

    const remainingTime = session.expiresAt - Date.now();

    if (remainingTime <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(logout, remainingTime);

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}