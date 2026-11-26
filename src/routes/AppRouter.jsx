import {
  lazy,
  Suspense,
  useEffect,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/useAuth";
import ErrorBoundary from "../components/ErrorBoundary";
import ProtectedRoute from "./ProtectedRoute";

const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Chat = lazy(() => import("../pages/Chat"));
const Developer = lazy(() => import("../pages/Developer"));
const DeveloperUploads = lazy(
  () => import("../pages/DeveloperUploads")
);
const NotFound = lazy(() => import("../pages/NotFound"));

function HomeRedirect() {
  const { isAuthenticated } = useAuth();

  return (
    <Navigate
      to={isAuthenticated ? "/chat" : "/login"}
      replace
    />
  );
}

function RouteAccessibility() {
  const location = useLocation();

  useEffect(() => {
    const routeTitles = [
      { match: "/login", title: "Log in" },
      { match: "/register", title: "Create account" },
      { match: "/chat", title: "Chat" },
      {
        match: "/developer/uploads",
        title: "Developer uploads",
      },
      {
        match: "/developer",
        title: "JavaScript Playground",
      },
    ];

    const current = routeTitles.find(({ match }) =>
      location.pathname.startsWith(match)
    );

    document.title = current
      ? `${current.title} | DevConnect`
      : "DevConnect";

    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById("main-content");

      main?.focus({
        preventScroll: true,
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [location.pathname]);

  const announcement = location.pathname.startsWith("/chat")
    ? "Chat page"
    : location.pathname.startsWith("/developer/uploads")
      ? "Developer uploads page"
      : location.pathname.startsWith("/developer")
        ? "JavaScript playground page"
        : location.pathname.startsWith("/register")
          ? "Registration page"
          : location.pathname.startsWith("/login")
            ? "Login page"
            : "Page changed";

  return (
    <div
      className="visually-hidden"
      aria-live="polite"
      aria-atomic="true"
      key={location.pathname}
    >
      {announcement}
    </div>
  );
}

function RouteLoadingFallback() {
  return (
    <main
      id="main-content"
      className="route-loading"
      tabIndex={-1}
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="loading-spinner"
        aria-hidden="true"
      />

      <p>Loading page...</p>
    </main>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <>
      <a
        className="skip-to-content"
        href="#main-content"
      >
        Skip to main content
      </a>

      <RouteAccessibility />

      <Suspense fallback={<RouteLoadingFallback />}>
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route
              path="/"
              element={<HomeRedirect />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/chat"
                element={<Chat />}
              />

              <Route
                path="/chat/:slug"
                element={<Chat />}
              />

              <Route
                path="/developer"
                element={<Developer />}
              />

              <Route
                path="/developer/uploads"
                element={<DeveloperUploads />}
              />
            </Route>

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default AppRouter;