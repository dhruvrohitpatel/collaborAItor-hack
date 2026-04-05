import { NextResponse } from "next/server";

import { callGeminiForJSON } from "@/lib/ai/gemini";
import { hasGeminiCredentials, rewriteMessage } from "@/lib/ai/mock";
import { buildRewritePrompt } from "@/lib/ai/prompts";
import {
  aiRewriteMessageRequestSchema,
  aiRewriteMessageResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { message, tone, audience } = aiRewriteMessageRequestSchema.parse(body);

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildRewritePrompt(message, tone, audience);
      const raw = await callGeminiForJSON(prompt);

      const validated = aiRewriteMessageResponseSchema.parse(raw);
      return NextResponse.json(validated);
    } catch (err) {
      const message_err = err instanceof Error ? err.message : String(err);
      console.error(`[rewrite-message] Gemini call failed: ${message_err}`);
      // Fall through to deterministic mock.
    }
  }

  const mock = await rewriteMessage(message, tone, audience);
  return NextResponse.json(aiRewriteMessageResponseSchema.parse(mock));
}
