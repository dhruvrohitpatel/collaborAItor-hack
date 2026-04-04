import { NextResponse } from "next/server";

import { callGeminiForJSON } from "@/lib/ai/gemini";
import { generateMockCharter, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildCharterPrompt } from "@/lib/ai/prompts";
import { aiCharterRequestSchema, aiCharterResponseSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiCharterRequestSchema.parse(body);

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildCharterPrompt(payload);
      const raw = await callGeminiForJSON(prompt);

      const validated = aiCharterResponseSchema.parse(raw);
      return NextResponse.json(validated);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[charter] Gemini call failed for ${payload.teamName}: ${message}`);
      // Fall through to deterministic mock.
    }
  }

  const mock = await generateMockCharter(payload);
  return NextResponse.json(aiCharterResponseSchema.parse(mock));
}
