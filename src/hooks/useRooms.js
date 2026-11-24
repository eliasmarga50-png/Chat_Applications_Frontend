import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getRooms } from "../services/roomService";
import { normalizeRoom } from "../utils/roomAdapter";
import { useChat } from "./useChat";

function useRooms() {
  const { state, dispatch } = useChat();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestControllerRef = useRef(null);

  const loadRooms = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);

      dispatch({
        type: "SET_LOADING_ROOMS",
        payload: true,
      });

      try {
        const data = await getRooms({ signal });

        if (signal?.aborted) return;

        dispatch({
          type: "SET_ROOMS",
          payload: data.map(normalizeRoom),
        });
      } catch (requestError) {
        if (signal?.aborted) return;

        setError(requestError);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);

          dispatch({
            type: "SET_LOADING_ROOMS",
            payload: false,
          });
        }
      }
    },
    [dispatch]
  );

  useEffect(() => {
    const controller = new AbortController();

    requestControllerRef.current = controller;

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        loadRooms(controller.signal);
      }
    });

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
    rooms: state.rooms,
    loading,
    error,
    retry,
  };
}

export { useRooms };