const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured.");
}

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach the JWT when a session exists.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Convert the response body from JSON into a JavaScript object.
  const data = await response.json().catch(() => null);

  // fetch() does not reject just because the server returned 400 or 401.
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