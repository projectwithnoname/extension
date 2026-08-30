import { describe, it, expect, vi, beforeEach } from "vitest";
import { uninstallUrlFor, syncUninstallLogout } from "../../src/background/auth";
import { LOGOUT_URL } from "../../src/shared/auth";
import type { AuthState } from "../../src/shared/auth";

const setUninstallURL = vi.fn();

beforeEach(() => {
  setUninstallURL.mockClear();
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: { setUninstallURL },
  };
});

describe("uninstallUrlFor", () => {
  it("logs a signed-in user out", () => {
    const state: AuthState = {
      status: "signed-in",
      user: { sub: "auth0|1", email: "a@b.c", name: "A" },
    };

    expect(uninstallUrlFor(state)).toBe(LOGOUT_URL);
  });

  it("opens nothing for a signed-out user", () => {
    expect(uninstallUrlFor({ status: "signed-out" })).toBe("");
  });

  it("opens nothing before the state has been read", () => {
    expect(uninstallUrlFor({ status: "unknown" })).toBe("");
  });
});

describe("syncUninstallLogout", () => {
  it("hands the url to chrome", () => {
    syncUninstallLogout({
      status: "signed-in",
      user: { sub: "auth0|1", email: "a@b.c", name: "A" },
    });

    expect(setUninstallURL).toHaveBeenCalledWith(LOGOUT_URL);
  });

  it("clears the url on sign-out", () => {
    syncUninstallLogout({ status: "signed-out" });

    expect(setUninstallURL).toHaveBeenCalledWith("");
  });
});
