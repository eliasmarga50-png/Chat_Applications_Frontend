import { useCallback, useEffect, useState } from "react";
import { getRoom } from "../services/roomService";
import { normalizeRoom } from "../utils/roomAdapter";

export function useRoom(slug) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    if (!slug) {
      setRoom(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function fetchRoom() {
      setLoading(true);
      setError(null);

      try {
        const data = await getRoom(slug, {
          signal: controller.signal,
        });

        setRoom(normalizeRoom(data.room ?? data));
      } catch (err) {
        if (err.name === "AbortError") return;

        setRoom(null);
        setError(err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchRoom();

    return () => {
      controller.abort();
    };
  }, [slug, refreshKey]);

  return {
    room,
    loading,
    error,
    retry,
  };
}