import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireApiTeamAccess, requireStudentApi } from "@/lib/auth/guards";
import { createGoogleOAuthUrl } from "@/lib/google/oauth";

const requestSchema = z.object({
  teamId: z.string().min(1),
  returnTo: z.string().nullable().default(null)
});

export async function POST(request: Request) {
  try {
    const user = await requireStudentApi();
    const body = await request.json();
    const parsed = requestSchema.parse(body);
    await requireApiTeamAccess(parsed.teamId);

    const oauthUrl = createGoogleOAuthUrl({
      teamId: parsed.teamId,
      memberEmail: user.email,
      firebaseUid: user.uid,
      returnTo: parsed.returnTo
    });
    const state = new URL(oauthUrl).searchParams.get("state");
    return NextResponse.json({ oauthUrl, state });
  } catch (error) {
    return authErrorResponse(error);
  }
}
