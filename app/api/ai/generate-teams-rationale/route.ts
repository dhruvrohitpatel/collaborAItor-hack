import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { generateMockRationale, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildTeamRationalePrompt } from "@/lib/ai/prompts";
import {
  aiGenerateTeamsRationaleRequestSchema,
  aiGenerateTeamsRationaleResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    await requireInstructorApi();
    const body = await request.json();
    const payload = aiGenerateTeamsRationaleRequestSchema.parse(body);
    const model = getGeminiModel();

    if (hasGeminiCredentials()) {
      try {
        const prompt = buildTeamRationalePrompt(payload);
        const raw = await callGeminiForJSON(prompt);

        const validated = aiGenerateTeamsRationaleResponseSchema.parse(raw);
        return NextResponse.json({
          ...validated,
          meta: {
            provider: "gemini",
            model,
            fallbackReason: null
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[rationale] Gemini call failed for ${payload.teamId}: ${message}`);
        const rationale = await generateMockRationale(payload);
        return NextResponse.json({
          ...aiGenerateTeamsRationaleResponseSchema.parse({ rationale }),
          meta: {
            provider: "mock",
            model,
            fallbackReason: message
          }
        });
      }
    }

    const rationale = await generateMockRationale(payload);
    return NextResponse.json({
      ...aiGenerateTeamsRationaleResponseSchema.parse({ rationale }),
      meta: {
        provider: "mock",
        model,
        fallbackReason: "No Gemini credentials found."
      }
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
