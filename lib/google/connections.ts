import { decryptToken, encryptToken } from "@/lib/google/token-crypto";
import { fetchGoogleUserEmail, refreshAccessToken } from "@/lib/google/oauth";
import {
  getGoogleConnectionByEmail,
  googleConnectionIdFromIdentity,
  listGoogleConnectionsByEmails,
  revokeGoogleConnectionByEmail,
  saveGoogleConnection
} from "@/lib/repo/googleConnections";
import type { GoogleConnectionInput } from "@/lib/schemas";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isActiveConnection(connection: GoogleConnectionInput | null) {
  return Boolean(connection && !connection.revokedAt);
}

function isoAfterSeconds(seconds: number) {
  return new Date(Date.now() + Math.max(0, seconds) * 1000).toISOString();
}

function parseScopes(scopeValue?: string) {
  if (!scopeValue) {
    return [];
  }

  return scopeValue
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function isTokenExpired(expiry: string | null) {
  if (!expiry) {
    return true;
  }

  return new Date(expiry).getTime() <= Date.now() + 60_000;
}

export async function getGoogleConnectionStatusByEmails(emails: string[]) {
  const normalized = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  const connections = await listGoogleConnectionsByEmails(normalized);
  const activeByEmail = new Map(
    connections
      .filter((connection) => isActiveConnection(connection))
      .map((connection) => [normalizeEmail(connection.email), connection])
  );

  const connected = normalized.filter((email) => activeByEmail.has(email));
  const missing = normalized.filter((email) => !activeByEmail.has(email));

  return {
    connectedEmails: connected,
    membersMissingGoogle: missing,
    connections: connections.filter((connection) => isActiveConnection(connection))
  };
}

export async function saveConnectionFromOAuth(params: {
  firebaseUid: string | null;
  expectedEmail: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scopes?: string;
}) {
  const actualEmail = await fetchGoogleUserEmail(params.accessToken);
  const existing = await getGoogleConnectionByEmail(actualEmail);
  const selectedId = googleConnectionIdFromIdentity({
    firebaseUid: params.firebaseUid,
    email: actualEmail
  });
  const fallbackRefreshToken =
    params.refreshToken ??
    (existing?.refreshTokenEncrypted ? decryptToken(existing.refreshTokenEncrypted) : undefined);

  if (!fallbackRefreshToken) {
    throw new Error(
      "Google refresh token missing. Reconnect with consent to allow calendar invites."
    );
  }

  const nextConnection: GoogleConnectionInput = {
    id: selectedId,
    firebaseUid: params.firebaseUid,
    email: actualEmail,
    scopes: parseScopes(params.scopes),
    refreshTokenEncrypted: encryptToken(fallbackRefreshToken),
    accessTokenEncrypted: encryptToken(params.accessToken),
    expiry: isoAfterSeconds(params.expiresIn),
    connectedAt: new Date().toISOString(),
    revokedAt: null
  };

  const saved = await saveGoogleConnection(nextConnection);
  const expected = normalizeEmail(params.expectedEmail);

  return {
    connection: saved,
    connectedEmail: actualEmail,
    emailMatchesExpected: actualEmail === expected
  };
}

export async function getUsableAccessTokenForEmail(email: string) {
  const connection = await getGoogleConnectionByEmail(email);
  if (!connection || connection.revokedAt) {
    throw new Error("Google account is not connected for this member.");
  }

  const refreshToken = decryptToken(connection.refreshTokenEncrypted);
  const existingAccessToken = connection.accessTokenEncrypted
    ? decryptToken(connection.accessTokenEncrypted)
    : null;

  if (existingAccessToken && !isTokenExpired(connection.expiry)) {
    return {
      accessToken: existingAccessToken,
      connection
    };
  }

  const refreshed = await refreshAccessToken(refreshToken);
  const refreshedAccessToken = refreshed.access_token;
  const nextConnection: GoogleConnectionInput = {
    id: connection.id,
    firebaseUid: connection.firebaseUid,
    email: connection.email,
    refreshTokenEncrypted: connection.refreshTokenEncrypted,
    accessTokenEncrypted: encryptToken(refreshedAccessToken),
    expiry: isoAfterSeconds(refreshed.expires_in),
    scopes: refreshed.scope ? parseScopes(refreshed.scope) : connection.scopes,
    connectedAt: connection.connectedAt,
    revokedAt: null
  };
  const saved = await saveGoogleConnection(nextConnection);

  return {
    accessToken: refreshedAccessToken,
    connection: saved
  };
}

export async function disconnectGoogleByEmail(email: string) {
  return revokeGoogleConnectionByEmail(email);
}
