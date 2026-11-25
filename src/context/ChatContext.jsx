
import {
  createContext,
  useReducer,
} from "react";

import {
  chatReducer,
  initialChatState,
} from "../reducers/chatReducer";

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(
    chatReducer,
    initialChatState
  );

  const value = {
    state,
    dispatch,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
