import { useCallback, useEffect, useRef, useState } from "react";

import { getRooms } from "../services/roomService";
import { normalizeRoom } from "../utils/roomAdapter";

function useRooms() {
  const [state, setState] = useState({
    rooms: [],
    loading: true,
    error: null,
  });

  const requestControllerRef = useRef(null);

  const loadRooms = useCallback(
    async (signal, updateLoading = true) => {
      if (updateLoading) {
        setState((previous) => ({
          ...previous,
          loading: true,
          error: null,
        }));
      }

      try {
        const data = await getRooms({ signal });

        if (signal?.aborted) return;

        setState({
          rooms: data.map(normalizeRoom),
          loading: false,
          error: null,
        });
      } catch (error) {
        if (signal?.aborted) return;

        setState((previous) => ({
          ...previous,
          loading: false,
          error,
        }));
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    requestControllerRef.current = controller;

    loadRooms(controller.signal, false);

    return () => {
      controller.abort();
      requestControllerRef.current = null;
    };
  }, [loadRooms]);

  const retry = useCallback(() => {
    requestControllerRef.current?.abort();

    const controller = new AbortController();

    requestControllerRef.current = controller;

    loadRooms(controller.signal);
  }, [loadRooms]);

  return {
    ...state,
    retry,
  };
}

export { useRooms };