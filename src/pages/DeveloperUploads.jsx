
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import "./DeveloperUploads.css";
import { useAuth } from "../context/useAuth";
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  uploadFile,
  validateUploadFile,
} from "../services/developerService";

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

    try {
      const response = await uploadFile(selectedFile, {
        signal: controller.signal,
      });

      setUploadedFile(response?.upload ?? null);
      setSelectedFile(null);
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

              <h1>File Uploads</h1>

              <p>
                Upload source code, text, log and JSON files
                to your developer workspace.
              </p>
            </div>

            <span className="upload-limit-pill">
              Maximum {formatFileSize(MAX_UPLOAD_BYTES)}
            </span>
          </header>

          <section className="upload-card">
            <div className="upload-card-heading">
              <div>
                <h2>Select a file</h2>

                <p>
                  Your file is uploaded securely using your
                  authenticated session.
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
                  <dd>
                    {uploadedFile.createdAt
                      ? new Date(
                          uploadedFile.createdAt
                        ).toLocaleString()
                      : "Just now"}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          <section className="upload-guidance">
            <h2>Before uploading</h2>

            <ul>
              <li>
                Only the file types listed above are supported.
              </li>

              <li>
                Files must not be empty and cannot exceed 100 MB.
              </li>

              <li>
                Uploads require an active DevConnect login session.
              </li>

              <li>
                The server stores the file bytes and upload
                metadata separately.
              </li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DeveloperUploads;
