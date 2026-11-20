import { apiRequest } from "./api";

// Fetch all public rooms.
export async function getRooms({ signal } = {}) {
  const data = await apiRequest("/api/rooms", {
    signal,
  });

  return data.rooms;
}

// Fetch a single room by its slug.
export function getRoom(slug, { signal } = {}) {
  return apiRequest(
    `/api/rooms/${encodeURIComponent(slug)}`,
    {
      signal,
    }
  );
}