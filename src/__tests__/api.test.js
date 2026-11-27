
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import {
  apiFetch,
  apiRequest,
} from "../services/api";

describe("API service", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON requests with the correct headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/test", {
      method: "POST",
      body: JSON.stringify({
        message: "Hello",
      }),
    });

    expect(result.success).toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("attaches the JWT to authenticated requests", async () => {
    sessionStorage.setItem(
      "token",
      "test-jwt-token"
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/rooms");

    expect(fetchMock.mock.calls[0][1].headers.Authorization)
      .toBe("Bearer test-jwt-token");
  });

  it("does not attach an Authorization header without a token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/rooms");

    expect(
      fetchMock.mock.calls[0][1].headers.Authorization
    ).toBeUndefined();
  });

  it("returns JSON response data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        rooms: [
          { slug: "javascript" },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/rooms");

    expect(result.rooms).toHaveLength(1);
    expect(result.rooms[0].slug).toBe("javascript");
  });

  it("throws structured HTTP errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          message: "Room not found",
          code: "ROOM_NOT_FOUND",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/api/rooms/unknown")
    ).rejects.toMatchObject({
      message: "Room not found",
      status: 404,
      code: "ROOM_NOT_FOUND",
    });
  });

  it("dispatches unauthorized events for protected API requests", async () => {
    sessionStorage.setItem(
      "token",
      "expired-jwt-token"
    );

    const handler = vi.fn();

    window.addEventListener(
      "auth:unauthorized",
      handler
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        apiRequest("/api/rooms")
      ).rejects.toMatchObject({
        status: 401,
      });

      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(
        "auth:unauthorized",
        handler
      );
    }
  });

  it("does not dispatch unauthorized events for login failures", async () => {
    const handler = vi.fn();

    window.addEventListener(
      "auth:unauthorized",
      handler
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: "Invalid username or password",
          code: "INVALID_CREDENTIALS",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            username: "ada",
            password: "wrong-password",
          }),
        })
      ).rejects.toMatchObject({
        status: 401,
        code: "INVALID_CREDENTIALS",
      });

      expect(handler).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(
        "auth:unauthorized",
        handler
      );
    }
  });
});
