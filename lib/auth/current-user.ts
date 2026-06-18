import { headers } from "next/headers";

const AUTH_MODE = (process.env.DASH_AUTH_MODE ?? "none") as
  | "none"
  | "forward_auth";
const AUTH_ENABLED = AUTH_MODE !== "none";
export const DASH_ADMIN_GROUP = "dash-admins";

export type CurrentUser = {
  username: string;
  email: string | null;
  name: string | null;
  groups: string[];
};

const LOCAL_USER: CurrentUser = {
  username: "local",
  email: null,
  name: null,
  groups: [],
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!AUTH_ENABLED) return LOCAL_USER;

  if (process.env.NODE_ENV !== "production" && process.env.DASH_DEV_USER) {
    return {
      username: process.env.DASH_DEV_USER,
      email: process.env.DASH_DEV_EMAIL ?? null,
      name: process.env.DASH_DEV_NAME ?? null,
      groups: (process.env.DASH_DEV_GROUPS ?? "").split(",").filter(Boolean),
    };
  }

  const h = await headers();
  const username = h.get("x-authentik-username");

  if (!username) {
    return null;
  }

  return {
    username,
    email: h.get("x-authentik-email"),
    name: h.get("x-authentik-name"),
    groups:
      h
        .get("x-authentik-groups")
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
  };
}

export async function requireUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return user;
}

export async function requireGroup(group: string): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user?.groups.includes(group)) {
    return null;
  }

  return user;
}

export function requireAdmin(): Promise<CurrentUser | null> {
  if (!isAuthEnabled()) return Promise.resolve(LOCAL_USER);
  return requireGroup(DASH_ADMIN_GROUP);
}

export function isAdmin(user: CurrentUser | null): boolean {
  if (user === null) {
    if (!AUTH_ENABLED) return true;

    return false;
  }
  return user.groups.includes(DASH_ADMIN_GROUP);
}

export function isAuthEnabled(): boolean {
  return AUTH_ENABLED;
}
