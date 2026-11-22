
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL;
const ACK_TIMEOUT_MS = 8000;

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

// Wrap Socket.IO acknowledgement callbacks in a Promise.
export function emitWithAck(
  socket,
  event,
  payload,
  timeoutMs = ACK_TIMEOUT_MS
) {
  if (!socket?.connected) {
    return Promise.reject(
      new Error("Socket is not connected.")
    );
  }

  return new Promise((resolve, reject) => {
    socket.timeout(timeoutMs).emit(
      event,
      payload,
      (timeoutError, response) => {
        if (timeoutError) {
          reject(
            new Error(
              "The server did not acknowledge the event in time."
            )
          );
          return;
        }

        if (!response?.ok) {
          const error = new Error(
            response?.error?.message ||
              "The server rejected the event."
          );

          error.code =
            response?.error?.code ||
            "SOCKET_EVENT_FAILED";

          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
}

export function joinRoom(socket, slug) {
  return emitWithAck(
    socket,
    "room:join",
    { slug }
  );
}

export function leaveRoom(socket, slug) {
  return emitWithAck(
    socket,
    "room:leave",
    { slug }
  );
}

export function sendMessage(socket, slug, content) {
  return emitWithAck(
    socket,
    "message:send",
    { slug, content }
  );
}

export function setTyping(socket, event, slug) {
  return emitWithAck(
    socket,
    event,
    { slug }
  );
}
