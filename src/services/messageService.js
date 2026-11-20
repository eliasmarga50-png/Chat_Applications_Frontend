import { apiRequest } from "./api";

const DEFAULT_LIMIT = 20;

// Fetch message history for a room.
export function getRoomMessages(
  slug,
  {
    limit = DEFAULT_LIMIT,
    before,
    beforeId,
    signal,
  } = {}
) {
  const params = new URLSearchParams();

  params.set("limit", String(limit));

  // Cursor pagination requires both cursor fields.
  if (before && beforeId) {
    params.set("before", before);
    params.set("beforeId", beforeId);
  }

  const endpoint =
    `/api/rooms/${encodeURIComponent(slug)}/messages` +
    `?${params.toString()}`;

  return apiRequest(endpoint, {
    signal,
  });
}