
import { apiFetch, apiRequest } from "./api";

// Execute JavaScript on the backend's isolated code runner.
export function executeCode(code, { signal } = {}) {
  return apiRequest("/api/execute", {
    method: "POST",
    body: JSON.stringify({
      language: "javascript",
      code,
    }),
    signal,
  });
}

// Upload the File object itself.
// Do not JSON-encode it or wrap it in FormData.
export function uploadFile(file, { signal } = {}) {
  if (!(file instanceof File)) {
    return Promise.reject(
      new TypeError(
        "uploadFile expects a browser File object."
      )
    );
  }

  return apiRequest("/api/uploads", {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      "X-File-Name": file.name,
    },
    body: file,
    signal,
  });
}

// Retrieve an upload as binary data.
export async function downloadFile(
  uploadId,
  { signal } = {}
) {
  if (!uploadId || typeof uploadId !== "string") {
    throw new TypeError(
      "A valid upload ID is required."
    );
  }

  const response = await apiFetch(
    `/api/uploads/${encodeURIComponent(uploadId)}/content`,
    { signal }
  );

  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get(
      "Content-Disposition"
    ),
    contentType: response.headers.get("Content-Type"),
  };
}
