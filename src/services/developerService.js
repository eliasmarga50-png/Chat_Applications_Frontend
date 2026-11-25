
import { apiFetch, apiRequest } from "./api";

// Execute JavaScript on the backend's isolated code runner.
const MAX_CODE_LENGTH = 10000;

export function executeCode(code, { signal } = {}) {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Please enter some JavaScript code.");
  }

  if (code.length > MAX_CODE_LENGTH) {
    throw new Error(
      `Code cannot exceed ${MAX_CODE_LENGTH.toLocaleString()} characters.`
    );
  }

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
export async function uploadFile(file, { signal } = {}) {
  const validationError = validateUploadFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const mimeType = getUploadMimeType(file);
  const safeHeaderFilename = file.name.replace(/[^\x20-\x7E]/g, "_");

  return apiRequest("/api/uploads", {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      "X-File-Name": safeHeaderFilename,
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



