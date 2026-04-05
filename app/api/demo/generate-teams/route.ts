import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { generateTeamsForProfiles } from "@/lib/repo";
import { generateTeamsInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    await requireInstructorApi();
    const body = await request.json().catch(() => ({}));
    const payload = generateTeamsInputSchema.parse(body);

    const teams = await generateTeamsForProfiles(payload.teamSize);

    return NextResponse.json({
      ok: true,
      teams: teams.length
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
