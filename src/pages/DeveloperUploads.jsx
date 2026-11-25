
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/useAuth";

import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  uploadFile,
  validateUploadFile,
  listUploads,
  downloadUpload,
  deleteUpload,
} from "../services/developerService";

import "./DeveloperUploads.css";

const PAGE_SIZE = 10;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date) {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleString();
}

function DeveloperUploads() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [uploadsError, setUploadsError] = useState("");
  const [managementError, setManagementError] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Load the authenticated user's upload history.
  useEffect(() => {
    const controller = new AbortController();

    async function loadUploads() {
      setLoadingUploads(true);
      setUploadsError("");

      try {
        const response = await listUploads({
          page,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });

        setUploads(response.uploads ?? []);
        setPagination(response.pagination);

        if (
          response.pagination?.totalPages > 0 &&
          page > response.pagination.totalPages
        ) {
          setPage(response.pagination.totalPages);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setUploadsError(
            error.message || "Could not load uploaded files."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingUploads(false);
        }
      }
    }

    loadUploads();

    return () => {
      controller.abort();
    };
  }, [page, refreshKey]);

  // Cancel an active upload if the page is unmounted.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function selectFile(file) {
    if (!file || isUploading) return;

    const error = validateUploadFile(file);

    setUploadError("");
    setUploadedFile(null);
    setValidationError(error);
    setSelectedFile(error ? null : file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileInput(event) {
    selectFile(event.target.files?.[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isUploading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    selectFile(event.dataTransfer.files?.[0]);
  }

  async function handleUpload() {
    if (!selectedFile || isUploading) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsUploading(true);
    setUploadError("");
    setManagementError("");

    try {
      const response = await uploadFile(selectedFile, {
        signal: controller.signal,
      });

      setUploadedFile(response.upload ?? null);
      setSelectedFile(null);

      // Refresh the history so the new upload appears.
      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      if (error.name === "AbortError") {
        setUploadError("Upload cancelled.");
      } else if (error.status === 413) {
        setUploadError(
          "The server rejected the file because it exceeds 100 MB."
        );
      } else if (error.status === 415) {
        setUploadError("The server does not support this file type.");
      } else if (error.status === 429) {
        setUploadError(
          "Too many requests. Please wait before uploading again."
        );
      } else if (error.status === 401) {
        setUploadError(
          "Your session has expired. Please log in again."
        );
      } else {
        setUploadError(
          error.message || "The file could not be uploaded."
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsUploading(false);
    }
  }

  function handleCancelUpload() {
    abortControllerRef.current?.abort();
  }

  function handleRemoveFile() {
    if (isUploading) return;

    setSelectedFile(null);
    setValidationError("");
    setUploadError("");
    setUploadedFile(null);
  }

  async function handleDownload(upload) {
    if (downloadingId) return;

    setDownloadingId(upload.id);
    setManagementError("");

    try {
      await downloadUpload(upload);
    } catch (error) {
      setManagementError(
        error.message || "Download failed."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(upload) {
    if (deletingId || downloadingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${upload.originalName}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(upload.id);
    setManagementError("");

    try {
      await deleteUpload(upload.id);

      if (uploadedFile?.id === upload.id) {
        setUploadedFile(null);
      }

      setRefreshKey((current) => current + 1);
    } catch (error) {
      setManagementError(
        error.message || "The file could not be deleted."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  function handlePreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function handleNextPage() {
    setPage((current) =>
      Math.min(pagination.totalPages, current + 1)
    );
  }

  return (
    <div className="app">
      <div className="session-bar">
        <span>
          Signed in as <strong>{user?.username}</strong>
        </span>

        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <Navbar />

      <div className="app-body developer-tools-body">
        <Sidebar />

        <main className="developer-upload-page">
          <header className="developer-upload-heading">
            <div>
              <p className="developer-upload-eyebrow">
                DEVCONNECT / DEVELOPER TOOLS
              </p>

              <h1>File Management</h1>

              <p>
                Upload, browse, download, and manage your
                developer files.
              </p>
            </div>

            <span className="upload-limit-pill">
              Maximum {formatFileSize(MAX_UPLOAD_BYTES)}
            </span>
          </header>

          {/* Upload section */}
          <section className="upload-card">
            <div className="upload-card-heading">
              <div>
                <h2>Upload a new file</h2>

                <p>
                  Upload source code, text, log, and JSON files
                  to your developer workspace.
                </p>
              </div>
            </div>

            <div
              className={`upload-dropzone ${
                isDragging ? "upload-dropzone-active" : ""
              } ${
                isUploading ? "upload-dropzone-disabled" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-cloud-icon" aria-hidden="true">
                ↑
              </div>

              <h3>Drag and drop your file here</h3>

              <p>or select a file from your computer</p>

              <button
                type="button"
                className="choose-file-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Choose file
              </button>

              <input
                ref={fileInputRef}
                className="upload-file-input"
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
                onChange={handleFileInput}
                disabled={isUploading}
                aria-label="Choose a file to upload"
              />

              <small>
                Supported: {ACCEPTED_FILE_EXTENSIONS.join(", ")}
              </small>
            </div>

            {validationError && (
              <div
                className="upload-alert upload-alert-error"
                role="alert"
              >
                {validationError}
              </div>
            )}

            {selectedFile && (
              <div className="selected-file-card">
                <div className="selected-file-details">
                  <span className="selected-file-icon">
                    FILE
                  </span>

                  <div>
                    <strong>{selectedFile.name}</strong>

                    <span>
                      {formatFileSize(selectedFile.size)} ·{" "}
                      {selectedFile.type ||
                        "MIME type determined from extension"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="remove-selected-file"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  aria-label="Remove selected file"
                >
                  ×
                </button>
              </div>
            )}

            {uploadError && (
              <div
                className="upload-alert upload-alert-error"
                role="alert"
              >
                {uploadError}
              </div>
            )}

            <div className="upload-actions">
              {isUploading ? (
                <button
                  type="button"
                  className="cancel-upload-button"
                  onClick={handleCancelUpload}
                >
                  Cancel upload
                </button>
              ) : (
                <button
                  type="button"
                  className="start-upload-button"
                  onClick={handleUpload}
                  disabled={!selectedFile}
                >
                  Upload file
                </button>
              )}
            </div>

            {isUploading && (
              <div
                className="upload-progress-state"
                role="status"
                aria-live="polite"
              >
                <span className="upload-spinner" />

                <span>
                  Uploading {selectedFile?.name}…
                </span>

                <small>
                  Sending the original file bytes to the server.
                </small>
              </div>
            )}
          </section>

          {/* Latest upload result */}
          {uploadedFile && (
            <section
              className="upload-result-card"
              aria-live="polite"
            >
              <div className="upload-result-heading">
                <span className="upload-success-icon">✓</span>

                <div>
                  <h2>Upload completed</h2>
                  <p>Your file was saved successfully.</p>
                </div>
              </div>

              <dl className="upload-result-details">
                <div>
                  <dt>Filename</dt>
                  <dd>{uploadedFile.originalName}</dd>
                </div>

                <div>
                  <dt>Upload ID</dt>
                  <dd className="upload-id-value">
                    {uploadedFile.id}
                  </dd>
                </div>

                <div>
                  <dt>File size</dt>
                  <dd>{formatFileSize(uploadedFile.size)}</dd>
                </div>

                <div>
                  <dt>MIME type</dt>
                  <dd>{uploadedFile.mimeType}</dd>
                </div>

                <div>
                  <dt>SHA-256</dt>
                  <dd className="upload-hash-value">
                    {uploadedFile.sha256}
                  </dd>
                </div>

                <div>
                  <dt>Uploaded</dt>
                  <dd>{formatDate(uploadedFile.createdAt)}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Uploaded files management */}
          <section className="uploaded-files-section">
            <div className="uploaded-files-heading">
              <div>
                <h2>Your uploaded files</h2>

                <p>
                  Files saved to your account are loaded from
                  the backend.
                </p>
              </div>

              <button
                type="button"
                className="refresh-uploads-button"
                onClick={handleRefresh}
                disabled={loadingUploads}
              >
                ↻ Refresh
              </button>
            </div>

            {uploadsError && (
              <div
                className="upload-alert upload-alert-error"
                role="alert"
              >
                {uploadsError}
              </div>
            )}

            {managementError && (
              <div
                className="upload-alert upload-alert-error"
                role="alert"
              >
                {managementError}
              </div>
            )}

            {loadingUploads ? (
              <div className="uploads-loading">
                <span className="upload-spinner" />
                Loading your files…
              </div>
            ) : uploads.length === 0 ? (
              <div className="uploads-empty-state">
                <span className="uploads-empty-icon">▤</span>

                <h3>No uploaded files yet</h3>

                <p>
                  Files you upload will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="uploads-table-wrapper">
                  <table className="uploads-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {uploads.map((upload) => (
                        <tr key={upload.id}>
                          <td>
                            <div className="upload-table-filename">
                              <span className="upload-table-file-icon">
                                FILE
                              </span>

                              <span>{upload.originalName}</span>
                            </div>
                          </td>

                          <td>{upload.mimeType}</td>

                          <td>{formatFileSize(upload.size)}</td>

                          <td>{formatDate(upload.createdAt)}</td>

                          <td>
                            <div className="upload-row-actions">
                              <button
                                type="button"
                                className="download-upload-button"
                                onClick={() =>
                                  handleDownload(upload)
                                }
                                disabled={
                                  downloadingId !== null ||
                                  deletingId !== null
                                }
                              >
                                {downloadingId === upload.id
                                  ? "Downloading…"
                                  : "Download"}
                              </button>

                              <button
                                type="button"
                                className="delete-upload-button"
                                onClick={() =>
                                  handleDelete(upload)
                                }
                                disabled={
                                  deletingId !== null ||
                                  downloadingId !== null
                                }
                              >
                                {deletingId === upload.id
                                  ? "Deleting…"
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="uploads-pagination">
                  <span>
                    {pagination.total} total file
                    {pagination.total === 1 ? "" : "s"}
                    {" · "}
                    Page {pagination.page} of{" "}
                    {Math.max(pagination.totalPages, 1)}
                  </span>

                  <div>
                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={page <= 1 || loadingUploads}
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={
                        page >= pagination.totalPages ||
                        loadingUploads
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="upload-guidance">
            <h2>File management information</h2>

            <ul>
              <li>
                Your upload history is retrieved from MongoDB.
              </li>

              <li>
                Only files belonging to your account are listed.
              </li>

              <li>
                Downloads require an authenticated session.
              </li>

              <li>
                Deleting a file removes its stored file and
                database metadata.
              </li>

              <li>
                The maximum upload size is 100 MB.
              </li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DeveloperUploads;
