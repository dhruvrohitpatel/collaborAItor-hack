import { NextResponse } from "next/server";
import { z } from "zod";

import { createGoogleOAuthUrl } from "@/lib/google/oauth";

const requestSchema = z.object({
  teamId: z.string().min(1),
  memberEmail: z.string().email(),
  firebaseUid: z.string().nullable().default(null),
  returnTo: z.string().nullable().default(null)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.parse(body);

  try {
    const oauthUrl = createGoogleOAuthUrl(parsed);
    const state = new URL(oauthUrl).searchParams.get("state");
    return NextResponse.json({ oauthUrl, state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Google OAuth.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
