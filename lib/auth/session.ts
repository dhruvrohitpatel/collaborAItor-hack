import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  getAuth as getAdminAuth,
  type DecodedIdToken,
  type SessionCookieOptions
} from "firebase-admin/auth";
import { cookies } from "next/headers";

import { normalizeEmail } from "@/lib/email";
import { resolveRoleForEmail } from "@/lib/auth/roles";
import type { AppRole, SessionUser } from "@/lib/auth/types";

const SESSION_COOKIE_NAME = "collabor-aitor.session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

export function isFirebaseAdminConfigured() {
  return Boolean(getFirebaseAdminConfig());
}

function getFirebaseAdminApp() {
  const existing = getApps().find((app) => app.name === "collabor-aitor-admin");
  if (existing) {
    return existing;
  }

  const config = getFirebaseAdminConfig();
  if (!config) {
    throw new AuthError(
      500,
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  return initializeApp(
    {
      credential: cert(config)
    },
    "collabor-aitor-admin"
  );
}

type SessionTokenClaims = Pick<DecodedIdToken, "uid" | "email" | "email_verified"> & {
  name?: unknown;
  picture?: unknown;
};

function toSessionUser(decoded: SessionTokenClaims) {
  if (!decoded.email) {
    throw new AuthError(401, "Authenticated user is missing an email address.");
  }

  if (!decoded.email_verified) {
    throw new AuthError(403, "Your Google account email must be verified before using this app.");
  }

  const normalizedEmail = normalizeEmail(decoded.email);
  const role = resolveRoleForEmail(normalizedEmail);

  if (!role) {
    throw new AuthError(403, "This email is not allowlisted for the demo.");
  }

  return {
    uid: decoded.uid,
    email: normalizedEmail,
    role,
    name: typeof decoded.name === "string" ? decoded.name : null,
    picture: typeof decoded.picture === "string" ? decoded.picture : null,
    emailVerified: Boolean(decoded.email_verified)
  } satisfies SessionUser;
}

function getSessionOptions(): SessionCookieOptions {
  return {
    expiresIn: SESSION_DURATION_MS
  };
}

function decodeTestSessionCookie(value: string) {
  if (
    (process.env.NODE_ENV !== "test" && process.env.ENABLE_TEST_AUTH !== "true") ||
    !value.startsWith("test:")
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(value.slice("test:".length), "base64url").toString("utf8")
    ) as SessionUser;

    if (!payload.email || !payload.role || !payload.uid) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(idToken: string) {
  const auth = getAdminAuth(getFirebaseAdminApp());
  const decoded = await auth.verifyIdToken(idToken, true);
  const user = toSessionUser(decoded);
  const cookie = await auth.createSessionCookie(idToken, getSessionOptions());

  return {
    cookie,
    user
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieMaxAgeSeconds() {
  return Math.floor(SESSION_DURATION_MS / 1000);
}

export async function verifySessionCookieValue(value: string) {
  const auth = getAdminAuth(getFirebaseAdminApp());
  const decoded = await auth.verifySessionCookie(value, true);
  return toSessionUser(decoded);
}

export async function getOptionalSessionUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  const testUser = decodeTestSessionCookie(sessionCookie);
  if (testUser) {
    return testUser;
  }

  try {
    return await verifySessionCookieValue(sessionCookie);
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getOptionalSessionUser();

  if (!user) {
    throw new AuthError(401, "Sign in to continue.");
  }

  return user;
}

export async function requireRole(role: AppRole) {
  const user = await requireSessionUser();

  if (user.role !== role) {
    throw new AuthError(403, `This action requires ${role} access.`);
  }

  return user;
}

export type { AppRole, SessionUser };
