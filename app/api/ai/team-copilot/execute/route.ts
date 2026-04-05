import { NextResponse } from "next/server";

import { executeCopilotRun } from "@/lib/ai/teamCopilot";
import {
  teamCopilotExecuteRequestSchema,
  teamCopilotExecuteResponseSchema
} from "@/lib/ai/schemas";
import { getTeamById, saveTeam } from "@/lib/repo";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = teamCopilotExecuteRequestSchema.parse(body);
  const team = await getTeamById(parsed.teamId);

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  try {
    const result = await executeCopilotRun(team, parsed);
    await saveTeam(result.team);
    return NextResponse.json(teamCopilotExecuteResponseSchema.parse(result.response));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
