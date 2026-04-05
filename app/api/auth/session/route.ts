import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  AuthError,
  createSessionCookie,
  getOptionalSessionUser,
  getSessionCookieMaxAgeSeconds,
  getSessionCookieName
} from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getOptionalSessionUser();

    return NextResponse.json({
      authenticated: Boolean(user),
      user
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ authenticated: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { idToken?: string };

    if (!body.idToken) {
      throw new AuthError(400, "Missing Firebase ID token.");
    }

    const { cookie, user } = await createSessionCookie(body.idToken);
    const response = NextResponse.json({ ok: true, user });
    response.cookies.set({
      name: getSessionCookieName(),
      value: cookie,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionCookieMaxAgeSeconds()
    });

    return response;
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
