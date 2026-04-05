import { NextResponse } from "next/server";

import { generateTeamsForProfiles } from "@/lib/repo";
import { generateTeamsInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const payload = generateTeamsInputSchema.parse(body);

  const teams = await generateTeamsForProfiles(payload.teamSize);

  return NextResponse.json({
    ok: true,
    teams: teams.length
  });
}
