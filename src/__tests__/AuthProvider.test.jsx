
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { AuthProvider } from "../context/AuthProvider";
import { useAuth } from "../context/useAuth";

import {
  loginUser,
  registerUser,
} from "../services/authService";

vi.mock("../services/authService", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

function AuthConsumer() {
  const {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  } = useAuth();

  return (
    <div>
      <p>
        Status: {isAuthenticated ? "Authenticated" : "Guest"}
      </p>

      <p>
        User: {user?.username || "None"}
      </p>

      <p>
        Token: {token || "None"}
      </p>

      <p>
        Loading: {String(loading)}
      </p>

      <button
        onClick={() =>
          login({
            username: "ada",
            password: "password123",
          })
        }
      >
        Login
      </button>

      <button
        onClick={() =>
          register({
            username: "grace",
            email: "grace@example.com",
            password: "password123",
          })
        }
      >
        Register
      </button>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("starts as a guest", () => {
    renderAuthProvider();

    expect(
      screen.getByText("Status: Guest")
    ).toBeInTheDocument();

    expect(
      screen.getByText("User: None")
    ).toBeInTheDocument();
  });

  it("logs in and stores the session", async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({
      token: "test-jwt-token",
      user: {
        id: "user123",
        username: "ada",
      },
    });

    renderAuthProvider();

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByText("Status: Authenticated")
    ).toBeInTheDocument();

    expect(
      screen.getByText("User: ada")
    ).toBeInTheDocument();

    expect(
      sessionStorage.getItem("token")
    ).toBe("test-jwt-token");

    expect(
      JSON.parse(sessionStorage.getItem("user"))
    ).toEqual({
      id: "user123",
      username: "ada",
    });
  });

  it("registers and stores the new session", async () => {
    const user = userEvent.setup();

    registerUser.mockResolvedValue({
      token: "register-jwt-token",
      user: {
        id: "user456",
        username: "grace",
      },
    });

    renderAuthProvider();

    await user.click(
      screen.getByRole("button", { name: "Register" })
    );

    expect(
      await screen.findByText("Status: Authenticated")
    ).toBeInTheDocument();

    expect(
      screen.getByText("User: grace")
    ).toBeInTheDocument();

    expect(
      sessionStorage.getItem("token")
    ).toBe("register-jwt-token");
  });

  it("logs out and clears the session", async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({
      token: "test-jwt-token",
      user: {
        id: "user123",
        username: "ada",
      },
    });

    renderAuthProvider();

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByText("Status: Authenticated")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Logout" })
    );

    expect(
      screen.getByText("Status: Guest")
    ).toBeInTheDocument();

    expect(
      sessionStorage.getItem("token")
    ).toBeNull();

    expect(
      sessionStorage.getItem("user")
    ).toBeNull();
  });

  it("clears authentication after an unauthorized event", async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({
      token: "test-jwt-token",
      user: {
        id: "user123",
        username: "ada",
      },
    });

    renderAuthProvider();

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByText("Status: Authenticated")
    ).toBeInTheDocument();

    fireEvent(
      window,
      new Event("auth:unauthorized")
    );

    expect(
      await screen.findByText("Status: Guest")
    ).toBeInTheDocument();

    expect(
      sessionStorage.getItem("token")
    ).toBeNull();
  });
});
