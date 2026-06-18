import { headers } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentUser,
  isAdmin,
  isAuthEnabled,
  requireAdmin,
  requireGroup,
  requireUser,
  requireUserOr401,
} from "./current-user";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

function fakeHeaders(entries: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    get: (name: string) => lower[name.toLowerCase()] ?? null,
  } as unknown as Headers;
}

const DASH_ENV_KEYS = [
  "DASH_AUTH_MODE",
  "DASH_DEV_USER",
  "DASH_DEV_EMAIL",
  "DASH_DEV_NAME",
  "DASH_DEV_GROUPS",
] as const;

describe("auth/current-user", () => {
  const ORIG_NODE_ENV = process.env.NODE_ENV;
  const ORIG_DASH: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of DASH_ENV_KEYS) {
      ORIG_DASH[k] = process.env[k];
      delete process.env[k];
    }
    vi.mocked(headers).mockReset();
  });

  afterEach(() => {
    for (const k of DASH_ENV_KEYS) {
      if (ORIG_DASH[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = ORIG_DASH[k];
      }
    }
    process.env.NODE_ENV = ORIG_NODE_ENV;
  });

  describe("when auth is disabled (default)", () => {
    it("isAuthEnabled is false", () => {
      expect(isAuthEnabled()).toBe(false);
    });

    it("getCurrentUser returns the local user", async () => {
      await expect(getCurrentUser()).resolves.toEqual({
        username: "local",
        email: null,
        name: null,
        groups: [],
      });
    });

    it("requireUser returns the local user", async () => {
      await expect(requireUser()).resolves.toMatchObject({ username: "local" });
    });

    it("requireAdmin returns the local user without checking groups", async () => {
      await expect(requireAdmin()).resolves.toMatchObject({
        username: "local",
      });
    });

    it("isAdmin treats null as admin", () => {
      expect(isAdmin(null)).toBe(true);
    });

    it("requireUserOr401 returns the local user", async () => {
      const result = await requireUserOr401();
      expect(result).not.toBeInstanceOf(Response);
      expect(result).toMatchObject({ username: "local" });
    });
  });

  describe("when AUTH_MODE is forward_auth", () => {
    beforeEach(() => {
      process.env.DASH_AUTH_MODE = "forward_auth";
    });

    it("isAuthEnabled is true", () => {
      expect(isAuthEnabled()).toBe(true);
    });

    it("getCurrentUser returns null when the username header is missing", async () => {
      vi.mocked(headers).mockResolvedValue(fakeHeaders({}));
      await expect(getCurrentUser()).resolves.toBeNull();
    });

    it("getCurrentUser parses Authentik headers", async () => {
      vi.mocked(headers).mockResolvedValue(
        fakeHeaders({
          "x-authentik-username": "alice",
          "x-authentik-email": "alice@example.com",
          "x-authentik-name": "Alice",
          "x-authentik-groups": "dash-admins, beta ,gamma",
        }),
      );
      await expect(getCurrentUser()).resolves.toEqual({
        username: "alice",
        email: "alice@example.com",
        name: "Alice",
        groups: ["dash-admins", "beta", "gamma"],
      });
    });

    it("getCurrentUser handles missing optional headers", async () => {
      vi.mocked(headers).mockResolvedValue(
        fakeHeaders({ "x-authentik-username": "bob" }),
      );
      await expect(getCurrentUser()).resolves.toEqual({
        username: "bob",
        email: null,
        name: null,
        groups: [],
      });
    });

    it("uses DASH_DEV_USER outside production and skips the header lookup", async () => {
      process.env.NODE_ENV = "development";
      process.env.DASH_DEV_USER = "dev";
      process.env.DASH_DEV_EMAIL = "dev@example.com";
      process.env.DASH_DEV_NAME = "Dev User";
      process.env.DASH_DEV_GROUPS = "dash-admins,beta";

      const user = await getCurrentUser();
      expect(user).toEqual({
        username: "dev",
        email: "dev@example.com",
        name: "Dev User",
        groups: ["dash-admins", "beta"],
      });
      expect(vi.mocked(headers)).not.toHaveBeenCalled();
      expect(isAdmin(user)).toBe(true);
    });

    it("ignores DASH_DEV_USER in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.DASH_DEV_USER = "shouldNotBeUsed";
      vi.mocked(headers).mockResolvedValue(fakeHeaders({}));

      await expect(getCurrentUser()).resolves.toBeNull();
    });

    it("requireGroup only returns the user when the group matches", async () => {
      vi.mocked(headers).mockResolvedValue(
        fakeHeaders({
          "x-authentik-username": "u",
          "x-authentik-groups": "dash-admins,other",
        }),
      );
      await expect(requireGroup("dash-admins")).resolves.toMatchObject({
        username: "u",
      });
      await expect(requireGroup("missing")).resolves.toBeNull();
    });

    it("requireAdmin returns null for non-admin users", async () => {
      vi.mocked(headers).mockResolvedValue(
        fakeHeaders({
          "x-authentik-username": "u",
          "x-authentik-groups": "other",
        }),
      );
      await expect(requireAdmin()).resolves.toBeNull();
    });

    it("requireAdmin returns the user when in the admin group", async () => {
      vi.mocked(headers).mockResolvedValue(
        fakeHeaders({
          "x-authentik-username": "u",
          "x-authentik-groups": "dash-admins",
        }),
      );
      await expect(requireAdmin()).resolves.toMatchObject({ username: "u" });
    });

    it("isAdmin returns false for null and non-admin users", () => {
      expect(isAdmin(null)).toBe(false);
      expect(
        isAdmin({
          username: "u",
          email: null,
          name: null,
          groups: ["other"],
        }),
      ).toBe(false);
    });

    it("requireUserOr401 returns a 401 response when there is no user", async () => {
      vi.mocked(headers).mockResolvedValue(fakeHeaders({}));
      const result = await requireUserOr401();
      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "unauthorized",
      });
    });

    it("requireUserOr401 returns the user when authenticated", async () => {
      vi.mocked(headers).mockResolvedValue(
        fakeHeaders({ "x-authentik-username": "u" }),
      );
      const result = await requireUserOr401();
      expect(result).not.toBeInstanceOf(Response);
      expect(result).toMatchObject({ username: "u" });
    });
  });
});
