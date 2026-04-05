import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireApiTeamAccess } from "@/lib/auth/guards";
import { resolveCopilotActorStudentId } from "@/lib/ai/copilot-actor";
import { createCopilotRun } from "@/lib/ai/teamCopilot";
import { teamCopilotRequestSchema, teamCopilotResponseSchema } from "@/lib/ai/schemas";
import { getTeamById, saveTeam } from "@/lib/repo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = teamCopilotRequestSchema.parse(body);
    const { user } = await requireApiTeamAccess(parsed.teamId);
    const team = await getTeamById(parsed.teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const actorStudentId = resolveCopilotActorStudentId(team, user);

    const result = await createCopilotRun(team, {
      ...parsed,
      actorStudentId
    });
    try {
      await saveTeam(result.team);
    } catch (saveError) {
      const saveMessage =
        saveError instanceof Error ? saveError.message : "Failed to persist copilot run.";
      console.error(`[team-copilot] failed to persist run: ${saveMessage}`, saveError);

      if (result.response.requiresApproval) {
        return NextResponse.json(
          {
            error:
              "Copilot preview was generated, but it could not be saved for approval. Check Firestore permissions/config and try again."
          },
          { status: 500 }
        );
      }

      result.response.meta = {
        ...result.response.meta,
        fallbackReason: `Preview generated but history was not saved: ${saveMessage}`
      };
    }

    return NextResponse.json(teamCopilotResponseSchema.parse(result.response));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[team-copilot] preview failed: ${message}`, error);
    return authErrorResponse(error);
  }
}
