import { useEffect, useReducer } from "react";

import { ChatContext } from "./chat-context";
import { chatReducer, initialChatState } from "../reducers/chatReducer";

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(
    chatReducer,
    initialChatState
  );

  useEffect(() => {
    dispatch({
      type: "RESET_CHAT_STATE",
    });
  }, []);

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