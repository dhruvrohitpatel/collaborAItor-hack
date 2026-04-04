import { NextResponse } from "next/server";

import { generateMockCharter, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildCharterPrompt } from "@/lib/ai/prompts";
import { aiCharterRequestSchema, aiCharterResponseSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiCharterRequestSchema.parse(body);

  const prompt = buildCharterPrompt(
    payload.teamName,
    payload.memberNames,
    payload.projectTheme
  );

  if (hasGeminiCredentials()) {
    // TODO: Replace with Gemini call using prompt.
    void prompt;
  }

  const mock = await generateMockCharter(payload.teamName, payload.memberNames);
  return NextResponse.json(aiCharterResponseSchema.parse(mock));
}
