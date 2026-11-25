
import { useReducer } from "react";

import { ChatContext } from "./ChatContext";

import {
  chatReducer,
  initialChatState,
} from "../reducers/chatReducer";

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
