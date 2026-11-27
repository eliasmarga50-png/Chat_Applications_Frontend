
import {
  describe,
  it,
  expect,
} from "vitest";

import {
  normalizeRoom,
} from "../utils/roomAdapter";

describe("normalizeRoom", () => {
  it("normalizes a JavaScript room", () => {
    const result = normalizeRoom({
      _id: "room123",
      slug: "javascript",
      name: "JavaScript",
      tags: ["react", "node"],
    });

    expect(result).toMatchObject({
      id: "room123",
      slug: "javascript",
      name: "javascript",
      icon: "JS",
      tags: ["react", "node"],
    });
  });

  it("uses id when MongoDB _id is unavailable", () => {
    const result = normalizeRoom({
      id: "room456",
      slug: "python",
    });

    expect(result.id).toBe("room456");
  });

  it("handles missing tags", () => {
    const result = normalizeRoom({
      slug: "rust",
    });

    expect(result.tags).toEqual([]);
  });

  it("returns null for an invalid room", () => {
    expect(normalizeRoom(null)).toBeNull();
  });

  it("generates an icon for an unknown room", () => {
    const result = normalizeRoom({
      slug: "golang",
    });

    expect(result.icon).toBe("GO");
  });
});
