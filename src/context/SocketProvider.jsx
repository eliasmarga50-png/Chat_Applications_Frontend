import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { SocketContext } from "./SocketContext";
import { useAuth } from "./useAuth";
import { createSocket } from "../services/socketService";

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  const [socket, setSocket] = useState(null);

  const [connectionStatus, setConnectionStatus] =
    useState("disconnected");

  const [connectionError, setConnectionError] =
    useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    const newSocket = createSocket(token);
    const manager = newSocket.io;

    function handleConnect() {
      setSocket(newSocket);
      setConnectionStatus("connected");
      setConnectionError(null);
    }

    function handleDisconnect(reason) {
      setSocket(newSocket);

      if (newSocket.active) {
        setConnectionStatus("reconnecting");
        setConnectionError(
          "Connection lost. Reconnecting..."
        );
        return;
      }

      setConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        setConnectionError(
          "The server disconnected your session."
        );
      } else {
        setConnectionError(
          "You are disconnected from the chat server."
        );
      }
    }

    function handleConnectError(error) {
      setSocket(newSocket);

      if (newSocket.active) {
        setConnectionStatus("reconnecting");
        setConnectionError(
          "Unable to connect. Retrying..."
        );
      } else {
        setConnectionStatus("error");
        setConnectionError(
          error.message || "Connection failed."
        );
      }
    }

    function handleReconnectAttempt() {
      setSocket(newSocket);
      setConnectionStatus("reconnecting");
      setConnectionError(
        "Connection lost. Reconnecting..."
      );
    }

    function handleReconnectError(error) {
      setConnectionStatus("reconnecting");
      setConnectionError(
        error.message || "Reconnection attempt failed."
      );
    }

    function handleAuthExpired() {
      window.dispatchEvent(
        new Event("auth:unauthorized")
      );

      newSocket.disconnect();
    }

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("auth:expired", handleAuthExpired);

    manager.on(
      "reconnect_attempt",
      handleReconnectAttempt
    );

    manager.on(
      "reconnect_error",
      handleReconnectError
    );

    newSocket.connect();

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("connect_error", handleConnectError);
      newSocket.off("auth:expired", handleAuthExpired);

      manager.off(
        "reconnect_attempt",
        handleReconnectAttempt
      );

      manager.off(
        "reconnect_error",
        handleReconnectError
      );

      newSocket.disconnect();
    };
  }, [token, isAuthenticated]);

  const activeSocket =
    isAuthenticated &&
    token &&
    socket?.auth?.token === token
      ? socket
      : null;

  const retryConnection = useCallback(() => {
    if (!activeSocket || activeSocket.connected) {
      return;
    }

    setConnectionStatus("connecting");
    setConnectionError(null);

    activeSocket.connect();
  }, [activeSocket]);

  const value = {
    socket: activeSocket,

    connectionStatus: activeSocket
      ? connectionStatus
      : isAuthenticated && token
        ? "connecting"
        : "disconnected",

    connectionError: activeSocket
      ? connectionError
      : null,

    retryConnection,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}