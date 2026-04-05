import { NextResponse } from "next/server";

import { generateTeamsForProfiles } from "@/lib/repo";
import { generateTeamsInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = generateTeamsInputSchema.parse(body);

    const teams = await generateTeamsForProfiles(payload.teamSize);

    return NextResponse.json({
      ok: true,
      teams: teams.length
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
