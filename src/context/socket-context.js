import { useEffect, useMemo, useState } from "react";

import { useAuth } from "./useAuth";
import { SocketContext } from "./socket-context";
import { createSocket } from "../services/socketService";

const AUTH_ERROR_CODES = [
  "AUTH_REQUIRED",
  "INVALID_TOKEN",
  "TOKEN_EXPIRED",
];

export function SocketProvider({ children }) {
  const { token } = useAuth();

  const socket = useMemo(
    () => (token ? createSocket(token) : null),
    [token]
  );

  const [connection, setConnection] = useState({
    token: null,
    status: "disconnected",
    error: null,
  });

  useEffect(() => {
    if (!socket || !token) return undefined;

    const onConnect = () => {
      setConnection({
        token,
        status: "connected",
        error: null,
      });
    };

    const onDisconnect = (reason) => {
      setConnection({
        token,
        status:
          reason === "io client disconnect"
            ? "disconnected"
            : "connecting",
        error:
          reason === "io client disconnect"
            ? null
            : "Connection lost. Reconnecting...",
      });
    };

    const onConnectError = (error) => {
      setConnection({
        token,
        status: "connecting",
        error:
          error?.message ||
          "Could not connect to the chat server.",
      });

      if (AUTH_ERROR_CODES.includes(error?.data?.code)) {
        window.dispatchEvent(
          new Event("auth:unauthorized")
        );
      }
    };

    const onAuthExpired = () => {
      window.dispatchEvent(
        new Event("auth:unauthorized")
      );

      socket.disconnect();
    };

    const onReconnectAttempt = () => {
      setConnection({
        token,
        status: "connecting",
        error: "Connection lost. Reconnecting...",
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("auth:expired", onAuthExpired);

    socket.io.on(
      "reconnect_attempt",
      onReconnectAttempt
    );

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("auth:expired", onAuthExpired);

      socket.io.off(
        "reconnect_attempt",
        onReconnectAttempt
      );

      socket.disconnect();
    };
  }, [socket, token]);

  const current = connection.token === token;

  const value = {
    socket: token ? socket : null,

    connectionStatus: !token
      ? "disconnected"
      : current
        ? connection.status
        : "connecting",

    connectionError:
      token && current
        ? connection.error
        : null,

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