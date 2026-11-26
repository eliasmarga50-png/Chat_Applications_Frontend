
import { useEffect } from "react";

function useEscapeKey(onEscape, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onEscape?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEscape, enabled]);
}

export default useEscapeKey;
