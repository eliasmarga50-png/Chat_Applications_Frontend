
import {
  describe,
  it,
  expect,
} from "vitest";

import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
} from "../utils/validation";

describe("Username validation", () => {
  it("accepts a valid username", () => {
    expect(validateUsername("ada"))
      .toBe("");
  });

  it("rejects an empty username", () => {
    expect(validateUsername(""))
      .toBe("Username is required.");
  });

  it("rejects usernames shorter than 3 characters", () => {
    expect(validateUsername("ab"))
      .toContain("between 3 and 32");
  });

  it("rejects uppercase characters", () => {
    expect(validateUsername("Ada"))
      .toContain("lowercase letters");
  });
});

describe("Email validation", () => {
  it("accepts a valid email", () => {
    expect(validateEmail("ada@example.com"))
      .toBe("");
  });

  it("rejects an invalid email", () => {
    expect(validateEmail("invalid-email"))
      .toContain("valid email");
  });
});

describe("Password validation", () => {
  it("accepts a valid password", () => {
    expect(validatePassword("password123"))
      .toBe("");
  });

  it("rejects a short password", () => {
    expect(validatePassword("123"))
      .toContain("between 8 and 128");
  });

  it("rejects an empty password", () => {
    expect(validatePassword(""))
      .toBe("Password is required.");
  });
});

describe("Registration validation", () => {
  it("validates all registration fields", () => {
    const result = validateRegistration({
      username: "ada",
      email: "ada@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      username: "",
      email: "",
      password: "",
    });
  });
});

describe("Login validation", () => {
  it("validates login credentials", () => {
    const result = validateLogin({
      username: "ada",
      password: "password123",
    });

    expect(result).toEqual({
      username: "",
      password: "",
    });
  });
});
