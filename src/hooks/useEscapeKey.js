import { useEffect } from "react";

function useEscapeKey(enabled, onEscape) {
  useEffect(() => {
    if (!enabled || typeof onEscape !== "function") {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onEscape();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onEscape]);
}

export default useEscapeKey;