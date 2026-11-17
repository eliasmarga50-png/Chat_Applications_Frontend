import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>

        <h2>Page not found</h2>

        <p>
          The page you are looking for doesn't exist
          or may have been moved.
        </p>

        <Link to={isAuthenticated ? "/chat" : "/login"}>
          {isAuthenticated ? "Back to DevConnect" : "Go to login"}
        </Link>
      </div>
    </main>
  );
}

export default NotFound;