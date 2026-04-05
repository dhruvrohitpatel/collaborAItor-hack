import { createHmac } from "node:crypto";

import { GOOGLE_CALENDAR_SCOPES, getGoogleOAuthConfig, hasGoogleOAuthConfig } from "@/lib/google/config";

type OAuthStatePayload = {
  teamId: string;
  memberEmail: string;
  firebaseUid: string | null;
  returnTo: string | null;
  issuedAt: number;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function stateSigningSecret() {
  const { encryptionKey } = getGoogleOAuthConfig();
  if (!encryptionKey) {
    throw new Error("Missing GOOGLE_TOKEN_ENCRYPTION_KEY.");
  }
  return encryptionKey;
}

function signState(payloadPart: string) {
  return createHmac("sha256", stateSigningSecret())
    .update(payloadPart)
    .digest("base64url");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createOAuthStateToken(input: Omit<OAuthStatePayload, "issuedAt">) {
  const payload: OAuthStatePayload = {
    ...input,
    memberEmail: normalizeEmail(input.memberEmail),
    returnTo: input.returnTo ?? null,
    issuedAt: Date.now()
  };

  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = signState(payloadPart);
  return `${payloadPart}.${signature}`;
}

export function parseOAuthStateToken(token: string) {
  const [payloadPart, signature] = token.split(".");

  if (!payloadPart || !signature) {
    throw new Error("Invalid OAuth state payload.");
  }

  const expected = signState(payloadPart);
  if (signature !== expected) {
    throw new Error("OAuth state signature mismatch.");
  }

  const raw = base64UrlDecode(payloadPart);
  const parsed = JSON.parse(raw) as OAuthStatePayload;

  if (!parsed.memberEmail || !parsed.teamId) {
    throw new Error("OAuth state is missing required fields.");
  }

  // 20-minute OAuth window.
  if (Date.now() - parsed.issuedAt > 20 * 60 * 1000) {
    throw new Error("OAuth state expired.");
  }

  return parsed;
}

export function createGoogleOAuthUrl(input: {
  teamId: string;
  memberEmail: string;
  firebaseUid: string | null;
  returnTo: string | null;
}) {
  if (!hasGoogleOAuthConfig()) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI, and GOOGLE_TOKEN_ENCRYPTION_KEY."
    );
  }

  const config = getGoogleOAuthConfig();
  const state = createOAuthStateToken(input);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function assertTokenResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as
    | GoogleTokenResponse
    | { error?: string; error_description?: string };

  if (!response.ok || "error" in payload) {
    const reason =
      "error_description" in payload && payload.error_description
        ? payload.error_description
        : "Token exchange failed.";
    throw new Error(reason);
  }

  return payload as GoogleTokenResponse;
}

export async function exchangeCodeForTokens(code: string) {
  const config = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  return assertTokenResponse(response);
}

export async function refreshAccessToken(refreshToken: string) {
  const config = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  return assertTokenResponse(response);
}

export async function fetchGoogleUserEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = (await response.json().catch(() => ({}))) as {
    email?: string;
  };

  if (!response.ok || !payload.email) {
    throw new Error("Could not fetch Google user email.");
  }

  return normalizeEmail(payload.email);
}
