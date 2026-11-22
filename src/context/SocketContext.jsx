
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./useAuth";
import { createSocket } from "../services/socketService";
import { SocketContext } from "./socket-context";

const AUTH_ERROR_CODES = [
  "AUTH_REQUIRED",
  "INVALID_TOKEN",
  "TOKEN_EXPIRED",
];

function isAuthError(code) {
  return AUTH_ERROR_CODES.includes(code);
}

export function SocketProvider({ children }) {
  const { token } = useAuth();

  // Create one socket instance for the current token.
  // createSocket() uses autoConnect:false, so it does
  // not connect until the effect calls socket.connect().
  const socket = useMemo(
    () => (token ? createSocket(token) : null),
    [token]
  );

  const [connectionState, setConnectionState] =
    useState({
      token: null,
      status: "disconnected",
      error: null,
    });

  // Manage the socket lifecycle.
  useEffect(() => {
    if (!socket || !token) {
      return undefined;
    }

    function handleConnect() {
      setConnectionState({
        token,
        status: "connected",
        error: null,
      });
    }

    function handleDisconnect(reason) {
      setConnectionState({
        token,
        status:
          reason === "io client disconnect"
            ? "disconnected"
            : "connecting",
        error:
          reason === "io client disconnect"
            ? null
            : reason ||
              "Connection lost. Reconnecting...",
      });
    }

    function handleConnectError(error) {
      setConnectionState({
        token,
        status: "connecting",
        error:
          error?.message ||
          "Could not connect to the chat server.",
      });

      // Authentication failures should clear the
      // frontend session through AuthContext.
      if (isAuthError(error?.data?.code)) {
        window.dispatchEvent(
          new Event("auth:unauthorized")
        );
      }
    }

    function handleAuthExpired() {
      window.dispatchEvent(
        new Event("auth:unauthorized")
      );

      socket.disconnect();
    }

    function handleReconnectAttempt() {
      setConnectionState({
        token,
        status: "connecting",
        error: "Connection lost. Reconnecting...",
      });
    }

    // Register listeners.
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("auth:expired", handleAuthExpired);

    socket.io.on(
      "reconnect_attempt",
      handleReconnectAttempt
    );

    // Start the connection.
    socket.connect();

    // Remove listeners and disconnect when the provider
    // is removed or the authenticated token changes.
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("auth:expired", handleAuthExpired);

      socket.io.off(
        "reconnect_attempt",
        handleReconnectAttempt
      );

      socket.disconnect();
    };
  }, [socket, token]);

  // State from a previous token must not be exposed
  // to the newly authenticated session.
  const isStateForCurrentToken =
    connectionState.token === token;

  const connectionStatus = token
    ? isStateForCurrentToken
      ? connectionState.status
      : "connecting"
    : "disconnected";

  const connectionError =
    token && isStateForCurrentToken
      ? connectionState.error
      : null;

  const value = {
    socket: token ? socket : null,
    connectionStatus,
    connectionError,
    isConnected: Boolean(
      token && socket?.connected
    ),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
