
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
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
        <main className="error-boundary">
          <div className="error-boundary-content">
            <span className="error-boundary-icon" aria-hidden="true">
              !
            </span>

            <h1>{title}</h1>

            <p>{message}</p>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>Technical details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button type="button" onClick={this.handleRetry}>
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
