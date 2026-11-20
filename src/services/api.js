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

  // JSON requests should have a content type.
  if (
    options.body &&
    typeof options.body === "string"
  ) {
    headers["Content-Type"] ??= "application/json";
  }

  // Attach JWT if the user is authenticated.
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

  // Safely parse the response.
  const data = await response.json().catch(() => null);

  // Handle expired/invalid authentication.
  if (
    response.status === 401 &&
    !endpoint.startsWith("/api/auth/")
  ) {
    window.dispatchEvent(
      new Event("auth:unauthorized")
    );
  }

  // Handle HTTP errors.
  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        "Something went wrong."
    );

    error.status = response.status;
    error.code = data?.error?.code;

    throw error;
  }

  return data;
}