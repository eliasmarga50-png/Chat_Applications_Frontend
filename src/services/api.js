
export const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured.");
}

function createRequestHeaders(options = {}) {
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  // JSON requests should have a content type.
  // File and Blob requests retain their supplied MIME type.
  if (
    options.body &&
    typeof options.body === "string"
  ) {
    headers["Content-Type"] ??= "application/json";
  }

  const token = sessionStorage.getItem("token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function dispatchUnauthorized(endpoint, status) {
  if (
    status === 401 &&
    !endpoint.startsWith("/api/auth/")
  ) {
    window.dispatchEvent(
      new Event("auth:unauthorized")
    );
  }
}

async function createHttpError(response) {
  const data = await response.json().catch(() => null);

  const error = new Error(
    data?.error?.message ||
      "Something went wrong."
  );

  error.status = response.status;
  error.code = data?.error?.code;

  return error;
}

// Shared authenticated fetch for JSON, binary uploads, and downloads.
export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: createRequestHeaders(options),
    }
  );

  dispatchUnauthorized(endpoint, response.status);

  if (!response.ok) {
    throw await createHttpError(response);
  }

  return response;
}

// Existing application services use this helper for JSON responses.
export async function apiRequest(endpoint, options = {}) {
  const response = await apiFetch(endpoint, options);

  return response.json().catch(() => null);
}
