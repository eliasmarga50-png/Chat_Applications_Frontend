
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import { useAuth } from "../context/useAuth";
import { executeCode } from "../services/developerService";

import "./Developer.css";

const MAX_CODE_LENGTH = 10000;
const REQUEST_TIMEOUT_MS = 15000;

const DEFAULT_CODE = `// Welcome to DevConnect Developer Workspace!

const numbers = [10, 20, 30, 40, 50];

const total = numbers.reduce(
  (sum, number) => sum + number,
  0
);

console.log("Hello, Developer!");
console.log("Numbers:", numbers);
console.log("Total:", total);

console.log("Execution successful!");
`;

function Developer() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [execution, setExecution] = useState(null);
  const [requestError, setRequestError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const controllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const requestTimedOutRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      controllerRef.current?.abort();
    };
  }, []);

  async function handleRunCode() {
    if (isRunning) return;

    if (!code.trim()) {
      setRequestError("Please enter some JavaScript code.");
      setExecution(null);
      return;
    }

    if (code.length > MAX_CODE_LENGTH) {
      setRequestError(
        `Your code exceeds the ${MAX_CODE_LENGTH.toLocaleString()} character limit.`
      );
      setExecution(null);
      return;
    }

    const controller = new AbortController();

    controllerRef.current = controller;
    requestTimedOutRef.current = false;

    setIsRunning(true);
    setExecution(null);
    setRequestError("");

    timeoutRef.current = window.setTimeout(() => {
      requestTimedOutRef.current = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const result = await executeCode(code, {
        signal: controller.signal,
      });

      setExecution(result);
    } catch (error) {
      if (requestTimedOutRef.current) {
        setRequestError(
          "The server did not respond in time. Please try again."
        );
      } else if (error.name === "AbortError") {
        return;
      } else if (error.status === 429) {
        setRequestError(
          "Execution limit reached. Please wait before running more code."
        );
      } else if (error.status === 401) {
        setRequestError(
          "Your session has expired. Please log in again."
        );
      } else if (error.status >= 500) {
        setRequestError(
          "The server encountered an error while processing your request."
        );
      } else {
        setRequestError(
          error.message || "Unable to execute your code."
        );
      }
    } finally {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      controllerRef.current = null;
      requestTimedOutRef.current = false;

      setIsRunning(false);
    }
  }

  function handleClearConsole() {
    setExecution(null);
    setRequestError("");
  }

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  const executionSucceeded =
    execution?.status === "ok";

  const executionFailed =
    execution?.status === "error" ||
    execution?.status === "timeout";

  return (
    <div className="app developer-app">
      <div className="session-bar">
        <span>
          Signed in as <strong>{user?.username}</strong>
        </span>

        <button
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>

      <Navbar />

      <div className="app-body">
        <Sidebar />

        <main className="developer-workspace">
          <header className="developer-header">
            <div>
              <p className="developer-eyebrow">
                DEVCONNECT / DEVELOPER TOOLS
              </p>

              <h1>JavaScript Playground</h1>

              <p className="developer-description">
                Write, execute and test JavaScript code
                directly inside DevConnect.
              </p>
            </div>

            <div className="developer-language">
              <span className="language-indicator"></span>
              JavaScript
            </div>
          </header>

          <section className="developer-editor-panel">
            <div className="developer-panel-header">
              <div className="editor-file">
                <span className="file-icon">JS</span>
                <span>main.js</span>
                <span className="file-modified">
                  JavaScript
                </span>
              </div>

              <div className="editor-toolbar">
                <span className="editor-character-count">
                  {code.length.toLocaleString()} /{" "}
                  {MAX_CODE_LENGTH.toLocaleString()}
                </span>

                <button
                  type="button"
                  className="run-code-button"
                  onClick={handleRunCode}
                  disabled={isRunning || !code.trim()}
                >
                  {isRunning ? (
                    <>
                      <span className="loading-spinner"></span>
                      Running...
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="code-editor">
              <div className="editor-line-numbers">
                {code.split("\n").map((_, index) => (
                  <span key={index}>
                    {index + 1}
                  </span>
                ))}
              </div>

              <textarea
                className="code-textarea"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
                placeholder="Write your JavaScript code here..."
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                maxLength={MAX_CODE_LENGTH}
                aria-label="JavaScript code editor"
                disabled={isRunning}
              />
            </div>

            <div className="editor-footer">
              <span>JavaScript</span>
              <span>UTF-8</span>
              <span>Spaces: 2</span>
            </div>
          </section>

          <section className="developer-console">
            <div className="console-header">
              <div className="console-title">
                <span className="console-icon">›_</span>
                <h2>Console</h2>
              </div>

              <div className="console-actions">
                {execution && (
                  <span
                    className={`execution-status ${
                      executionSucceeded
                        ? "status-success"
                        : "status-error"
                    }`}
                  >
                    {executionSucceeded
                      ? "Completed"
                      : execution.status === "timeout"
                        ? "Timed out"
                        : "Failed"}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearConsole}
                  className="clear-console-button"
                  disabled={
                    !execution && !requestError
                  }
                >
                  Clear console
                </button>
              </div>
            </div>

            <div
              className="console-output"
              aria-live="polite"
              aria-busy={isRunning}
            >
              {isRunning && (
                <div className="console-message">
                  <span className="loading-spinner"></span>
                  Executing JavaScript...
                </div>
              )}

              {!isRunning &&
                !execution &&
                !requestError && (
                  <div className="console-empty">
                    <span>⌘</span>
                    <p>
                      Your execution results will appear here.
                    </p>
                    <small>
                      Click Run Code to execute your JavaScript.
                    </small>
                  </div>
                )}

              {requestError && (
                <div className="console-error">
                  <strong>Request Error</strong>
                  <pre>{requestError}</pre>
                </div>
              )}

              {execution && (
                <>
                  {execution.stdout && (
                    <div className="console-section">
                      <div className="console-section-label">
                        OUTPUT
                      </div>

                      <pre className="console-stdout">
                        {execution.stdout}
                      </pre>
                    </div>
                  )}

                  {execution.stderr && (
                    <div className="console-section">
                      <div className="console-section-label error-label">
                        STDERR
                      </div>

                      <pre className="console-stderr">
                        {execution.stderr}
                      </pre>
                    </div>
                  )}

                  {execution.error && (
                    <div className="console-error">
                      <strong>
                        {execution.status === "timeout"
                          ? "Execution Timeout"
                          : "Execution Error"}
                      </strong>

                      <pre>{execution.error}</pre>
                    </div>
                  )}

                  {executionSucceeded &&
                    !execution.stdout &&
                    !execution.stderr && (
                      <div className="console-success-message">
                        Code executed successfully with no output.
                      </div>
                    )}

                  {executionFailed &&
                    !execution.error &&
                    !execution.stderr && (
                      <div className="console-error">
                        Execution failed. Check your code and try again.
                      </div>
                    )}

                  {execution.truncated && (
                    <div className="console-notice">
                      Output was truncated because it exceeded
                      the server output limit.
                    </div>
                  )}

                  <div className="execution-metadata">
                    <span>
                      Duration:{" "}
                      {typeof execution.durationMs === "number"
                        ? `${execution.durationMs} ms`
                        : "Unavailable"}
                    </span>

                    <span>
                      Status: {execution.status}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Developer;
