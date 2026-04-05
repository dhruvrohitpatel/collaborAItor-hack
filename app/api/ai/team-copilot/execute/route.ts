import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireApiTeamAccess } from "@/lib/auth/guards";
import { executeCopilotRun } from "@/lib/ai/teamCopilot";
import {
  teamCopilotExecuteRequestSchema,
  teamCopilotExecuteResponseSchema
} from "@/lib/ai/schemas";
import { getTeamById, saveTeam } from "@/lib/repo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = teamCopilotExecuteRequestSchema.parse(body);
    await requireApiTeamAccess(parsed.teamId);
    const team = await getTeamById(parsed.teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const result = await executeCopilotRun(team, parsed);
    await saveTeam(result.team);
    return NextResponse.json(teamCopilotExecuteResponseSchema.parse(result.response));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[team-copilot] execute failed: ${message}`, error);
    return authErrorResponse(error);
  }
}
