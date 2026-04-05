import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createCopilotRun } from "@/lib/ai/teamCopilot";
import { teamCopilotRequestSchema, teamCopilotResponseSchema } from "@/lib/ai/schemas";
import { getTeamById, saveTeam } from "@/lib/repo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = teamCopilotRequestSchema.parse(body);
    const team = await getTeamById(parsed.teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const result = await createCopilotRun(team, parsed);
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
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof ZodError ? 400 : 500;
    console.error(`[team-copilot] preview failed: ${message}`, error);
    return NextResponse.json({ error: message }, { status });
  }
}
