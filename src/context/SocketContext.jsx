
import {
  createContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "./useAuth";
import { createSocket } from "../services/socketService";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] =
    useState("disconnected");
  const [connectionError, setConnectionError] =
    useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSocket(null);
      setConnectionStatus("disconnected");
      setConnectionError(null);

      return undefined;
    }

    const newSocket = createSocket(token);

    function handleConnect() {
      setConnectionStatus("connected");
      setConnectionError(null);
    }

    function handleDisconnect(reason) {
      setConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        setConnectionError(
          "The server disconnected your session."
        );
      }
    }

    function handleConnectError(error) {
      setConnectionStatus("error");
      setConnectionError(error.message);
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

    setSocket(newSocket);
    setConnectionStatus("connecting");

    newSocket.connect();

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off(
        "connect_error",
        handleConnectError
      );
      newSocket.off(
        "auth:expired",
        handleAuthExpired
      );

      newSocket.disconnect();

      setSocket((currentSocket) =>
        currentSocket === newSocket ? null : currentSocket
      );
    };
  }, [token, isAuthenticated]);

  const value = {
    socket,
    connectionStatus,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
