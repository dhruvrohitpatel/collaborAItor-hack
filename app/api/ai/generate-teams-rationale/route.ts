import { NextResponse } from "next/server";

import { callGeminiForJSON } from "@/lib/ai/gemini";
import { generateMockRationale, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildTeamRationalePrompt } from "@/lib/ai/prompts";
import {
  aiGenerateTeamsRationaleRequestSchema,
  aiGenerateTeamsRationaleResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiGenerateTeamsRationaleRequestSchema.parse(body);

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildTeamRationalePrompt(payload);
      const raw = await callGeminiForJSON(prompt);

      const validated = aiGenerateTeamsRationaleResponseSchema.parse(raw);
      return NextResponse.json(validated);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[rationale] Gemini call failed for ${payload.teamId}: ${message}`);
      // Fall through to deterministic mock.
    }
  }

  const rationale = await generateMockRationale(payload);
  return NextResponse.json(aiGenerateTeamsRationaleResponseSchema.parse({ rationale }));
}
