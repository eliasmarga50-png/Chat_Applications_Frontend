
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

import {
  registerUser,
  loginUser,
} from "../services/authService";

describe("Authentication API services", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("sends registration data to the backend", async () => {
    const responseData = {
      user: {
        id: "user123",
        username: "ada",
        email: "ada@example.com",
      },
      token: "registration-token",
      expiresIn: 3600,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const userData = {
      username: "ada",
      email: "ada@example.com",
      password: "password123",
    };

    const result = await registerUser(userData);

    expect(result).toEqual(responseData);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/register"),
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body)
    ).toEqual(userData);
  });

  it("sends login credentials to the backend", async () => {
    const responseData = {
      user: {
        id: "user123",
        username: "ada",
      },
      token: "login-token",
      expiresIn: 3600,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const credentials = {
      username: "ada",
      password: "password123",
    };

    const result = await loginUser(credentials);

    expect(result).toEqual(responseData);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login"),
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body)
    ).toEqual(credentials);
  });

  it("preserves backend errors for invalid credentials", async () => {
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

    await expect(
      loginUser({
        username: "ada",
        password: "wrong-password",
      })
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid username or password",
    });
  });

  it("preserves duplicate-account registration errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          message: "Account already exists",
          code: "DUPLICATE_RESOURCE",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      registerUser({
        username: "ada",
        email: "ada@example.com",
        password: "password123",
      })
    ).rejects.toMatchObject({
      status: 409,
      message: "Account already exists",
    });
  });
});
