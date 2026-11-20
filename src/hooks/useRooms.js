import { useCallback, useEffect, useState } from "react";
import { getRooms } from "../services/roomService";
import { normalizeRoom } from "../utils/roomAdapter";

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRooms() {
      setLoading(true);
      setError(null);

      try {
        const data = await getRooms({
          signal: controller.signal,
        });

        const normalizedRooms = data.map(normalizeRoom);

        setRooms(normalizedRooms);
      } catch (err) {
        if (err.name === "AbortError") return;

        setError(err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchRooms();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  return {
    rooms,
    loading,
    error,
    retry,
  };
}