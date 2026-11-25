
import {
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

    function handleConnect() {
      setSocket(newSocket);
      setConnectionStatus("connected");
      setConnectionError(null);
    }

    function handleDisconnect(reason) {
      setSocket(newSocket);
      setConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        setConnectionError(
          "The server disconnected your session."
        );
      }
    }

    function handleConnectError(error) {
      setSocket(newSocket);
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

    newSocket.connect();

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("connect_error", handleConnectError);
      newSocket.off("auth:expired", handleAuthExpired);

      newSocket.disconnect();
    };
  }, [token, isAuthenticated]);

  const activeSocket =
    isAuthenticated && socket?.auth?.token === token
      ? socket
      : null;

  const value = {
    socket: activeSocket,
    connectionStatus: activeSocket
      ? connectionStatus
      : "disconnected",
    connectionError: activeSocket
      ? connectionError
      : null,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
