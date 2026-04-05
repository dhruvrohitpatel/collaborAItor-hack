import { NextResponse } from "next/server";

import { saveConnectionFromOAuth } from "@/lib/google/connections";
import { exchangeCodeForTokens, parseOAuthStateToken } from "@/lib/google/oauth";

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://localhost");

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return `${url.pathname}${url.search}`;
}

function safeReturnPath(pathname: string | null) {
  if (!pathname || !pathname.startsWith("/")) {
    return "/teams";
  }

  return pathname;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateToken = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    const destination = withQuery("/teams", {
      googleConnected: "0",
      reason: oauthError
    });
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (!code || !stateToken) {
    const destination = withQuery("/teams", {
      googleConnected: "0",
      reason: "missing_code_or_state"
    });
    return NextResponse.redirect(new URL(destination, request.url));
  }

  try {
    const state = parseOAuthStateToken(stateToken);
    const tokens = await exchangeCodeForTokens(code);
    const saved = await saveConnectionFromOAuth({
      firebaseUid: state.firebaseUid,
      expectedEmail: state.memberEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scopes: tokens.scope
    });

    const destination = withQuery(safeReturnPath(state.returnTo), {
      googleConnected: "1",
      email: saved.connectedEmail,
      mismatch: saved.emailMatchesExpected ? "0" : "1"
    });

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_callback_failed";
    const destination = withQuery("/teams", {
      googleConnected: "0",
      reason: message.slice(0, 100)
    });
    return NextResponse.redirect(new URL(destination, request.url));
  }
}
