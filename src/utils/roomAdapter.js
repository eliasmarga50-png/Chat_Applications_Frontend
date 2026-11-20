const ROOM_ICONS = {
  javascript: "JS",
  python: "PY",
  rust: "RS",
  devops: "DO",
  databases: "DB",
  "core-team": "CT",
};

export function normalizeRoom(room) {
  if (!room) return null;

  const slug = room.slug || "";

  return {
    ...room,

    // Unique identifier for the frontend.
    id: String(room._id ?? room.id ?? slug),

    // URL identifier.
    slug,

    // Consistent room name.
    name: slug || room.name?.replace(/^#/, "") || "unknown",

    // UI icon.
    icon:
      ROOM_ICONS[slug] ||
      slug.slice(0, 2).toUpperCase(),

    // Prevent invalid tags.
    tags: Array.isArray(room.tags) ? room.tags : [],
  };
}