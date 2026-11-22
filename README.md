# DevConnect Frontend — : Real-Time Communication

## Overview

Step 6 integrates the DevConnect React frontend with the existing Socket.IO backend to enable real-time communication.

Previously, messages were retrieved through REST API requests. With this implementation, users can receive new messages immediately without refreshing the page.

This step also introduces real-time typing indicators, connection status tracking, authenticated socket connections, room management, and reconnection handling.

## Features

- Authenticated Socket.IO connection using JWT
- Real-time message delivery
- Room joining and leaving
- Message sending with acknowledgement callbacks
- Real-time typing indicators
- Connection status display
- Reconnection handling
- Automatic room rejoining after reconnect
- Authentication expiration handling
- React lifecycle management and listener cleanup
- Integration with existing REST message history
- Duplicate-message prevention
- Room transition handling

## Technologies

- React
- JavaScript
- Socket.IO Client
- React Hooks
- REST API
- JWT Authentication

## Requirements

Before running this implementation, make sure:

- Node.js is installed.
- The DevConnect backend is running.
- MongoDB is connected to the backend.
- Redis is running if the backend is configured to use Redis for realtime state.
- The frontend has completed Steps 1–5.
- The frontend dependencies are installed.

## Installation

From the frontend project directory:

```bash
npm install
```

If Socket.IO Client has not already been installed:

```bash
npm install socket.io-client
```

## Environment Configuration

Create or update the `.env` file in the root of the frontend project.

```env
VITE_API_URL=http://localhost:4000
```

This variable defines the backend URL used by the frontend services.

Restart Vite after changing environment variables.

## Architecture

### `src/services/socketService.js`

Responsible for creating and configuring the Socket.IO client.

It provides the communication layer between the React frontend and the Socket.IO backend.

Responsibilities:

- Create an authenticated socket.
- Configure connection options.
- Emit socket events.
- Handle acknowledgement callbacks.
- Join and leave rooms.
- Send messages.
- Send typing events.

### `src/hooks/useChatSocket.js`

Responsible for managing Socket.IO within React.

Responsibilities:

- Establish the socket connection.
- Maintain connection status.
- Join the active chat room.
- Handle room transitions.
- Handle reconnects.
- Receive new messages.
- Receive typing updates.
- Handle authentication expiration.
- Send messages.
- Send typing events.
- Clean up listeners and connections.

### `src/hooks/useMessages.js`

Responsible for managing chat messages from both REST and Socket.IO.

Responsibilities:

- Retrieve historical messages.
- Support pagination.
- Maintain message state.
- Add real-time messages.
- Avoid duplicate messages.
- Preserve message ordering.

REST is used for retrieving existing message history, while Socket.IO handles new realtime messages.

### `src/components/chat/TypingIndicator.jsx`

Displays a typing indicator when other users are currently typing in the active room.

### `src/components/chat/MessageInput.jsx`

Responsible for the message input interface.

Responsibilities:

- Accept user input.
- Validate messages.
- Send messages.
- Track typing state.
- Stop typing when the message is sent or input is cleared.

### `src/components/chat/ChatWindow.jsx`

Displays the chat interface.

Responsibilities:

- Render messages.
- Display connection status.
- Display typing indicators.
- Show message loading and error states.
- Provide the message input.

### `src/pages/Chat.jsx`

Integrates the chat components, message history, and Socket.IO functionality into the chat page.

## Authentication

Socket.IO connections are authenticated using the JWT access token obtained during login.

The frontend passes the token through the Socket.IO authentication configuration.

The backend validates the token during the socket handshake.

Unauthenticated or invalid connections are rejected by the backend.

The backend also handles token expiration. When a session expires, the socket emits an authentication expiration event, allowing the frontend to terminate the session and redirect the user to authentication.

## Socket.IO Events

### Client → Server

| Event | Purpose | Payload |
|---|---|---|
| `room:join` | Join a room | `{ slug }` |
| `room:leave` | Leave a room | `{ slug }` |
| `message:send` | Send a message | `{ slug, content }` |
| `typing:start` | Notify that the user started typing | `{ slug }` |
| `typing:stop` | Notify that the user stopped typing | `{ slug }` |

### Server → Client

| Event | Purpose |
|---|---|
| `message:new` | Receive a newly created message |
| `typing:update` | Receive typing status updates |
| `auth:expired` | Notify that the authenticated session expired |

## Message Lifecycle

1. The user logs in through the REST API.
2. The frontend receives and stores the authentication token.
3. The chat page creates the authenticated Socket.IO connection.
4. The socket connects to the backend.
5. The frontend requests to join the currently selected room.
6. The backend validates room access and confirms the join.
7. The user sends a message.
8. The frontend emits `message:send`.
9. The backend validates the request and saves the message.
10. The backend acknowledges the sender.
11. The backend emits `message:new` to users in the room.
12. Connected users receive the message without refreshing.

## Typing Indicator Lifecycle

1. The user begins typing.
2. The frontend emits `typing:start`.
3. The backend broadcasts `typing:update`.
4. Other users receive the typing status.
5. When the user stops typing or sends a message, the frontend emits `typing:stop`.
6. The backend broadcasts the updated typing state.

Typing indicators are temporary realtime events and are not stored as messages in MongoDB.

## Connection Lifecycle

The frontend manages the socket connection through React effects.

### Connecting

When an authenticated user enters the chat, the socket is created and connects to the backend.

### Disconnecting

When the socket disconnects, the UI reflects the disconnected state.

### Reconnecting

Socket.IO attempts to reconnect when the connection is interrupted.

When reconnection succeeds, the frontend joins the currently selected room again.

### Cleanup

When the chat component unmounts or the authenticated session changes, the frontend removes its event listeners and disconnects its socket.

This prevents stale listeners, duplicated events, and unnecessary socket connections.

## Testing

### 1. Start the Backend

Run the backend in its project directory.

Make sure MongoDB and Redis are running if required by your backend configuration.

### 2. Start the Frontend

Run:

```bash
npm run dev
```

### 3. Log In

Log in using a seeded user or an account created through registration.

### 4. Open Two Sessions

Open the application in two separate browser sessions.

For example:

- Browser window 1: User A
- Browser window 2: User B

### 5. Join the Same Room

Both users should navigate to the same room.

### 6. Send a Message

Send a message from User A.

User B should receive the message immediately without refreshing.

### 7. Test Typing Indicators

Start typing in one session.

The other session should display the typing indicator.

### 8. Test Room Switching

Switch to another room.

Confirm that messages from the previous room do not appear in the active room.

### 9. Test Reconnection

Temporarily disconnect the backend or network.

Restore the connection and verify that the socket reconnects and rejoins the active room.

### 10. Test Authentication Expiration

Verify that an expired token causes the user to be redirected to authentication rather than remaining in an unauthorized chat session.

## Troubleshooting

### Socket cannot connect

- Verify that the backend is running.
- Verify `VITE_API_URL`.
- Check the backend CORS configuration.
- Check the browser console and Network tab.
- Verify the socket server is available.

### Messages are not appearing

- Verify both users are connected.
- Confirm that both users joined the same room.
- Inspect the `message:send` acknowledgement.
- Check the backend logs.
- Verify that `message:new` is being emitted and received.

### Typing indicators are not appearing

- Verify `typing:start` and `typing:stop` events are emitted.
- Verify the room slug is correct.
- Check that `typing:update` is received by the other user.

### Reconnection does not restore the chat

- Check the socket connection status.
- Verify that the reconnect event is firing.
- Confirm that the frontend attempts to join the active room after reconnecting.

### Authentication expiration

- Verify the token is being passed during the socket handshake.
- Verify that the frontend handles `auth:expired`.
- Confirm that the authentication context clears the expired session and redirects appropriately.

## Development Commands

Run the development server:

```bash
npm run dev
```

Run ESLint:

```bash
npm run lint
```

Build the frontend:

```bash
npm run build
```

## Step 6 Completion Criteria

Step 6 is complete when:

- [ ] Authenticated Socket.IO connections work.
- [ ] Users can join and leave chat rooms.
- [ ] Messages are sent through Socket.IO.
- [ ] Messages arrive in real time for other users.
- [ ] Message acknowledgements are handled.
- [ ] Typing indicators work.
- [ ] Connection status is displayed.
- [ ] Reconnection works.
- [ ] The active room is rejoined after reconnect.
- [ ] Authentication expiration is handled.
- [ ] Event listeners are cleaned up.
- [ ] No duplicate messages are created.
- [ ] ESLint passes.
- [ ] Production build passes.

---

**DevConnect Step 6 — Real-Time Communication with Socket.IO**
