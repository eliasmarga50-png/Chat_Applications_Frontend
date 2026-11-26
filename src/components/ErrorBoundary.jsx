import { Component, createRef } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };

    this.fallbackRef = createRef();
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(previousProps, previousState) {
    if (
      !previousState.hasError &&
      this.state.hasError
    ) {
      this.fallbackRef.current?.focus();
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const {
        title = "Something went wrong",
        message = "An unexpected error occurred. Please try again.",
      } = this.props;

      return (
        <main
          ref={this.fallbackRef}
          id="main-content"
          className="error-boundary"
          tabIndex={-1}
          role="alert"
          aria-labelledby="error-boundary-title"
        >
          <div className="error-boundary-content">
            <span
              className="error-boundary-icon"
              aria-hidden="true"
            >
              !
            </span>

            <h1 id="error-boundary-title">
              {title}
            </h1>

            <p>{message}</p>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>Technical details</summary>

                <pre>
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                type="button"
                onClick={this.handleRetry}
              >
                Try again
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Reload application
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;