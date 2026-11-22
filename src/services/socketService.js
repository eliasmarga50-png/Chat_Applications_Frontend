
import { io } from "socket.io-client";

// Use the same backend base URL as our REST API.
const SOCKET_URL = import.meta.env.VITE_API_URL;

if (!SOCKET_URL) {
  throw new Error("VITE_API_URL is not configured.");
}

export function createSocket(token) {
  if (!token) {
    throw new Error("A JWT token is required to create a socket.");
  }

  return io(SOCKET_URL, {
    autoConnect: false,

    auth: {
      token,
    },

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,

    timeout: 10000,
  });
}
