import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, logIn, logOut, signUp } from "../src/auth.ts";

const usersKey = "nyaylens.demoUsers.v1";

class MemoryStorage {
  values = new Map();

  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("sessionStorage", new MemoryStorage());
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("TextEncoder", TextEncoder);
});

describe("prototype authentication", () => {
  it("stores a salted password hash and starts a profile-only session", async () => {
    const user = await signUp("Ananya Sharma", "Ananya@example.test", "NyayLensDemo2026!");
    const stored = JSON.parse(localStorage.getItem(usersKey));

    expect(user).toEqual({ fullName: "Ananya Sharma", email: "ananya@example.test" });
    expect(stored[0].salt).toMatch(/^[a-f0-9]{32}$/);
    expect(stored[0].passwordHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored[0].passwordHash).not.toBe("NyayLensDemo2026!");
    expect(getCurrentUser()).toEqual(user);
  });

  it("logs in case-insensitively and rejects an incorrect password", async () => {
    await signUp("Ananya Sharma", "ananya@example.test", "NyayLensDemo2026!");
    logOut();

    await expect(logIn("ANANYA@example.test", "wrong-password")).rejects.toThrow(
      "Email or password is incorrect.",
    );
    await expect(logIn("ANANYA@example.test", "NyayLensDemo2026!")).resolves.toEqual({
      fullName: "Ananya Sharma",
      email: "ananya@example.test",
    });
  });

  it("rejects duplicate emails and invalid signup values", async () => {
    await expect(signUp(" ", "ananya@example.test", "NyayLensDemo2026!")).rejects.toThrow(
      "Enter your full name.",
    );
    await expect(signUp("Ananya", "not-an-email", "NyayLensDemo2026!")).rejects.toThrow(
      "Enter a valid email address.",
    );
    await expect(signUp("Ananya", "ananya@example.test", "short")).rejects.toThrow(
      "Use a password with at least 8 characters.",
    );

    await signUp("Ananya", "ananya@example.test", "NyayLensDemo2026!");
    await expect(signUp("Ananya Two", "ANANYA@example.test", "NyayLensDemo2026!"))
      .rejects.toThrow("An account with this email already exists. Please log in.");
  });

  it("ignores malformed browser records and logout preserves the account", async () => {
    localStorage.setItem(usersKey, JSON.stringify([null, {}, { email: "broken@example.test" }]));
    const user = await signUp("Ananya Sharma", "ananya@example.test", "NyayLensDemo2026!");

    logOut();
    expect(getCurrentUser()).toBeNull();
    await expect(logIn(user.email, "NyayLensDemo2026!")).resolves.toEqual(user);
  });
});
