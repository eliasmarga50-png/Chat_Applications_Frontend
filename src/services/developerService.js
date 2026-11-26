
import { apiRequest, API_BASE_URL } from "./api";

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const MIME_TYPES_BY_EXTENSION = {
  txt: "text/plain",
  js: "text/javascript",
  mjs: "text/javascript",
  cjs: "text/javascript",
  py: "text/x-python",
  java: "text/x-java",
  c: "text/x-c",
  h: "text/x-c",
  cpp: "text/x-c++",
  cc: "text/x-c++",
  cxx: "text/x-c++",
  hpp: "text/x-c++",
  ts: "text/x-typescript",
  log: "text/x-log",
  json: "application/json",
};

export const ACCEPTED_FILE_EXTENSIONS = Object.keys(
  MIME_TYPES_BY_EXTENSION
).map((extension) => `.${extension}`);

export function getUploadMimeType(file) {
  if (!(file instanceof File)) {
    return null;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  return MIME_TYPES_BY_EXTENSION[extension] ?? null;
}

export function validateUploadFile(file) {
  if (!(file instanceof File)) {
    return "Please select a valid file.";
  }

  if (file.size === 0) {
    return "Empty files cannot be uploaded.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "The maximum file size is 100 MB.";
  }

  if (!getUploadMimeType(file)) {
    return "Unsupported file type. Select a supported source, text, log, or JSON file.";
  }

  return "";
}

// POST /api/uploads
// Sends the original file bytes and reports actual browser upload progress.
export function uploadFile(
  file,
  { signal, onProgress } = {}
) {
  const validationError = validateUploadFile(file);

  if (validationError) {
    return Promise.reject(new Error(validationError));
  }

  if (signal?.aborted) {
    return Promise.reject(
      new DOMException("Upload cancelled.", "AbortError")
    );
  }

  const mimeType = getUploadMimeType(file);
  const safeFilename = file.name.replace(
    /[^\x20-\x7E]/g,
    "_"
  );

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    function cleanup() {
      signal?.removeEventListener("abort", handleAbort);
    }

    function fail(error) {
      if (settled) return;

      settled = true;
      cleanup();
      reject(error);
    }

    function handleAbort() {
      xhr.abort();
    }

    xhr.open("POST", `${API_BASE_URL}/api/uploads`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.setRequestHeader("X-File-Name", safeFilename);

    const token = sessionStorage.getItem("token");

    if (token) {
      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${token}`
      );
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;

      onProgress?.({
        percentage: Math.round(
          (event.loaded / event.total) * 100
        ),
        loaded: event.loaded,
        total: event.total,
      });
    });

    xhr.addEventListener("load", () => {
      const data = (() => {
  try {
    return JSON.parse(xhr.responseText);
  } catch {
    return null;
  }
})();

      if (xhr.status >= 200 && xhr.status < 300) {
        if (settled) return;

        settled = true;
        cleanup();
        resolve(data);
        return;
      }

      if (xhr.status === 401) {
        window.dispatchEvent(
          new Event("auth:unauthorized")
        );
      }

      const error = new Error(
        data?.error?.message ||
          "The file could not be uploaded."
      );

      error.status = xhr.status;
      error.code = data?.error?.code;

      fail(error);
    });

    xhr.addEventListener("error", () => {
      fail(
        new Error(
          "Network error. Check your connection and try again."
        )
      );
    });

    xhr.addEventListener("abort", () => {
      fail(
        new DOMException("Upload cancelled.", "AbortError")
      );
    });

    xhr.addEventListener("timeout", () => {
      fail(
        new Error("The upload timed out. Please try again.")
      );
    });

    signal?.addEventListener("abort", handleAbort, {
      once: true,
    });

    xhr.send(file);
  });
}

// GET /api/uploads
export async function listUploads({
  page = 1,
  limit = 10,
  signal,
} = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/uploads?${query.toString()}`, {
    method: "GET",
    signal,
  });
}

// GET /api/uploads/:id/content
export async function downloadUpload(upload, { signal } = {}) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/api/uploads/${encodeURIComponent(
      upload.id
    )}/content`,
    {
      method: "GET",
      headers: {
        Accept: "*/*",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      signal,
    }
  );

  if (response.status === 401) {
    window.dispatchEvent(
      new Event("auth:unauthorized")
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    const error = new Error(
      data?.error?.message ||
        "The file could not be downloaded."
    );

    error.status = response.status;
    error.code = data?.error?.code;

    throw error;
  }

  const blob = await response.blob();

  const disposition = response.headers.get(
    "Content-Disposition"
  );

  const filenameMatch = disposition?.match(
    /filename="([^"]+)"/i
  );

  const filename =
    filenameMatch?.[1] ||
    upload.originalName ||
    "download";

  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = objectUrl;
  downloadLink.download = filename;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

// DELETE /api/uploads/:id
export async function deleteUpload(id) {
  return apiRequest(
    `/api/uploads/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

// POST /api/execute
// Backend request body: { code, language: "javascript" }
export async function executeCode(code, { signal } = {}) {
  return apiRequest("/api/execute", {
    method: "POST",
    body: JSON.stringify({
      code,
      language: "javascript",
    }),
    signal,
  });
}
