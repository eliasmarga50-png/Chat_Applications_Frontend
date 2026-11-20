
import { useCallback, useEffect, useRef, useState } from "react";
import { getRoom } from "../services/roomService";
import { normalizeRoom } from "../utils/roomAdapter";

function useRoom(slug) {
  const [state, setState] = useState({
    slug: null,
    room: null,
    loading: false,
    error: null,
  });

  const requestControllerRef = useRef(null);

  const loadRoom = useCallback(
    async (targetSlug, signal, updateLoading = true) => {
      if (!targetSlug) return;

      if (updateLoading) {
        setState((previous) => ({
          ...previous,
          slug: targetSlug,
          loading: true,
          error: null,
        }));
      }

      try {
        const data = await getRoom(targetSlug, { signal });

        if (signal?.aborted) return;

        setState({
          slug: targetSlug,
          room: normalizeRoom(data),
          loading: false,
          error: null,
        });
      } catch (error) {
        if (signal?.aborted) return;

        setState({
          slug: targetSlug,
          room: null,
          loading: false,
          error,
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();
    requestControllerRef.current = controller;

    // Schedule the request after the effect finishes.
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        loadRoom(slug, controller.signal, false);
      }
    });

    return () => {
      controller.abort();
      requestControllerRef.current = null;
    };
  }, [slug, loadRoom]);

  const retry = useCallback(() => {
    if (!slug) return;

    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    loadRoom(slug, controller.signal);
  }, [slug, loadRoom]);

  if (state.slug !== slug) {
    return {
      room: null,
      loading: Boolean(slug),
      error: null,
      retry,
    };
  }

  return {
    room: state.room,
    loading: state.loading,
    error: state.error,
    retry,
  };
}

export { useRoom };
