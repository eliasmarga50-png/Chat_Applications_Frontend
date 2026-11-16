const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured.");
}

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem("token");

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] ??= "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const data = await response.json().catch(() => null);

  // A 401 from a protected endpoint means the current
  // authentication session can no longer be trusted.
  // Do not treat failed login credentials as an expired session.
  if (
    response.status === 401 &&
    !endpoint.startsWith("/api/auth/")
  ) {
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || "Something went wrong."
    );

    error.status = response.status;
    error.code = data?.error?.code;

    throw error;
  }

  return data;
}