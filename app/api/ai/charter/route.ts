import { NextResponse } from "next/server";

import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { generateMockCharter, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildCharterPrompt } from "@/lib/ai/prompts";
import { aiCharterRequestSchema, aiCharterResponseSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiCharterRequestSchema.parse(body);
  const model = getGeminiModel();

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildCharterPrompt(payload);
      const raw = await callGeminiForJSON(prompt);

      const validated = aiCharterResponseSchema.parse(raw);
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
      console.error(`[charter] Gemini call failed for ${payload.teamName}: ${message}`);
      const mock = await generateMockCharter(payload);
      return NextResponse.json({
        ...aiCharterResponseSchema.parse(mock),
        meta: {
          provider: "mock",
          model,
          fallbackReason: message
        }
      });
    }
  }

  const mock = await generateMockCharter(payload);
  return NextResponse.json({
    ...aiCharterResponseSchema.parse(mock),
    meta: {
      provider: "mock",
      model,
      fallbackReason: "No Gemini credentials found."
    }
  });
}
