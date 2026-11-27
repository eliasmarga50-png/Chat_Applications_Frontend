
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketProvider";
import { useSocket } from "../hooks/useSocket";

vi.mock("../services/socketService", () => ({
  createSocket: vi.fn(),
}));

import { createSocket } from "../services/socketService";

function createFakeSocket() {
  const listeners = new Map();
  const managerListeners = new Map();

  const manager = {
    on: vi.fn((event, callback) => {
      managerListeners.set(event, callback);
    }),
    off: vi.fn((event) => {
      managerListeners.delete(event);
    }),
    trigger(event, ...args) {
      managerListeners.get(event)?.(...args);
    },
  };

  const socket = {
    id: "socket-123",
    connected: false,
    active: true,
    auth: {},
    io: manager,

    on: vi.fn((event, callback) => {
      listeners.set(event, callback);
    }),

    off: vi.fn((event) => {
      listeners.delete(event);
    }),

    connect: vi.fn(),

    disconnect: vi.fn(),

    trigger(event, ...args) {
      listeners.get(event)?.(...args);
    },

    listeners,
  };

  return socket;
}

function SocketStatus() {
  const {
    socket,
    connectionStatus,
    connectionError,
    retryConnection,
  } = useSocket();

  return (
    <div>
      <p data-testid="status">{connectionStatus}</p>
      <p data-testid="socket">
        {socket ? "Socket available" : "No socket"}
      </p>
      <p data-testid="error">{connectionError || "No error"}</p>
      <button onClick={retryConnection}>Retry connection</button>
    </div>
  );
}

function renderSocketProvider(authValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <SocketProvider>
        <SocketStatus />
      </SocketProvider>
    </AuthContext.Provider>
  );
}

describe("SocketProvider", () => {
  let fakeSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeSocket = createFakeSocket();
    createSocket.mockReturnValue(fakeSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not create a socket for an unauthenticated user", () => {
    renderSocketProvider({
      token: null,
      isAuthenticated: false,
    });

    expect(createSocket).not.toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent(
      "disconnected"
    );
    expect(screen.getByTestId("socket")).toHaveTextContent(
      "No socket"
    );
  });

  it("creates and connects a socket for an authenticated user", () => {
    renderSocketProvider({
      token: "valid-jwt",
      isAuthenticated: true,
    });

    expect(createSocket).toHaveBeenCalledWith("valid-jwt");
    expect(fakeSocket.connect).toHaveBeenCalledOnce();
    expect(screen.getByTestId("status")).toHaveTextContent(
      "connecting"
    );
  });

  it("updates the connection status after connecting", () => {
    renderSocketProvider({
      token: "valid-jwt",
      isAuthenticated: true,
    });

    act(() => {
      fakeSocket.connected = true;
      fakeSocket.trigger("connect");
    });

    expect(screen.getByTestId("status")).toHaveTextContent(
      "connected"
    );
    expect(screen.getByTestId("socket")).toHaveTextContent(
      "Socket available"
    );
    expect(screen.getByTestId("error")).toHaveTextContent(
      "No error"
    );
  });

  it("sets reconnecting status when the connection is interrupted", () => {
    renderSocketProvider({
      token: "valid-jwt",
      isAuthenticated: true,
    });

    act(() => {
      fakeSocket.connected = true;
      fakeSocket.trigger("connect");
    });

    act(() => {
      fakeSocket.active = true;
      fakeSocket.trigger("disconnect", "transport close");
    });

    expect(screen.getByTestId("status")).toHaveTextContent(
      "reconnecting"
    );
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Connection lost. Reconnecting..."
    );
  });

  it("updates status when a reconnection attempt begins", () => {
    renderSocketProvider({
      token: "valid-jwt",
      isAuthenticated: true,
    });

    act(() => {
      fakeSocket.io.trigger("reconnect_attempt");
    });

    expect(screen.getByTestId("status")).toHaveTextContent(
      "reconnecting"
    );
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Connection lost. Reconnecting..."
    );
  });

  it("allows the user to retry a disconnected socket", () => {
    renderSocketProvider({
      token: "valid-jwt",
      isAuthenticated: true,
    });

    act(() => {
      fakeSocket.trigger("connect");
    });

    act(() => {
      fakeSocket.connected = false;
    });

    screen.getByRole("button", {
      name: "Retry connection",
    }).click();

    expect(fakeSocket.connect).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("status")).toHaveTextContent(
      "connecting"
    );
  });

  it("dispatches auth:unauthorized when the server expires the session", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    renderSocketProvider({
      token: "expired-jwt",
      isAuthenticated: true,
    });

    act(() => {
      fakeSocket.trigger("auth:expired", {
        code: "TOKEN_EXPIRED",
      });
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "auth:unauthorized",
      })
    );

    expect(fakeSocket.disconnect).toHaveBeenCalled();
  });

  it("removes socket listeners and disconnects when the provider unmounts", () => {
    const { unmount } = renderSocketProvider({
      token: "valid-jwt",
      isAuthenticated: true,
    });

    unmount();

    expect(fakeSocket.off).toHaveBeenCalledWith(
      "connect",
      expect.any(Function)
    );
    expect(fakeSocket.off).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function)
    );
    expect(fakeSocket.off).toHaveBeenCalledWith(
      "connect_error",
      expect.any(Function)
    );
    expect(fakeSocket.off).toHaveBeenCalledWith(
      "auth:expired",
      expect.any(Function)
    );

    expect(fakeSocket.io.off).toHaveBeenCalledWith(
      "reconnect_attempt",
      expect.any(Function)
    );

    expect(fakeSocket.io.off).toHaveBeenCalledWith(
      "reconnect_error",
      expect.any(Function)
    );

    expect(fakeSocket.disconnect).toHaveBeenCalled();
  });
});
