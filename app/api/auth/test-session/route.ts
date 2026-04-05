import { Buffer } from "node:buffer";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionCookieMaxAgeSeconds, getSessionCookieName } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

const requestSchema = z.object({
  uid: z.string().min(1).default("test-user"),
  email: z.string().email(),
  role: z.enum(["instructor", "student"]),
  name: z.string().nullable().default(null),
  picture: z.string().nullable().default(null),
  emailVerified: z.boolean().default(true)
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "test" && process.env.ENABLE_TEST_AUTH !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const user = requestSchema.parse(body) as SessionUser;
  const cookieValue = `test:${Buffer.from(JSON.stringify(user)).toString("base64url")}`;
  const response = NextResponse.json({ ok: true, user });

  response.cookies.set({
    name: getSessionCookieName(),
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: getSessionCookieMaxAgeSeconds()
  });

  return response;
}
