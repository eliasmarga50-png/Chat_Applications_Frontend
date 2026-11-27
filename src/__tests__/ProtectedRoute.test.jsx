
import {
  describe,
  it,
  expect,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import ProtectedRoute from "../routes/ProtectedRoute";

function LoginPage() {
  const location = useLocation();

  return (
    <div>
      <h1>Login page</h1>

      <p>
        Redirect destination:{" "}
        {location.state?.from?.pathname || "None"}
      </p>
    </div>
  );
}

function renderRoutes(isAuthenticated, initialPath) {
  return render(
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: isAuthenticated
          ? { id: "user123", username: "ada" }
          : null,
      }}
    >
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/chat"
              element={<h1>Chat dashboard</h1>}
            />

            <Route
              path="/chat/:slug"
              element={<h1>Chat room</h1>}
            />

            <Route
              path="/developer"
              element={<h1>Developer playground</h1>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("Protected routes", () => {
  it("redirects unauthenticated users to login", () => {
    renderRoutes(false, "/chat");

    expect(
      screen.getByRole("heading", {
        name: "Login page",
      })
    ).toBeInTheDocument();
  });

  it("preserves the requested destination", () => {
    renderRoutes(false, "/chat/javascript");

    expect(
      screen.getByText(
        "Redirect destination: /chat/javascript"
      )
    ).toBeInTheDocument();
  });

  it("allows authenticated users into the chat dashboard", () => {
    renderRoutes(true, "/chat");

    expect(
      screen.getByRole("heading", {
        name: "Chat dashboard",
      })
    ).toBeInTheDocument();
  });

  it("allows authenticated users into the developer page", () => {
    renderRoutes(true, "/developer");

    expect(
      screen.getByRole("heading", {
        name: "Developer playground",
      })
    ).toBeInTheDocument();
  });
});
