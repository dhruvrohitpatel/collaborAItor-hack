export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
  "profile"
] as const;

export function getGoogleOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
    encryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? ""
  };
}

export function hasGoogleOAuthConfig() {
  const config = getGoogleOAuthConfig();
  return Boolean(
    config.clientId && config.clientSecret && config.redirectUri && config.encryptionKey
  );
}
