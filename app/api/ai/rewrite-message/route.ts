import { NextResponse } from "next/server";

import { rewriteMessage } from "@/lib/ai/mock";
import { buildRewritePrompt } from "@/lib/ai/prompts";
import {
  aiRewriteMessageRequestSchema,
  aiRewriteMessageResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiRewriteMessageRequestSchema.parse(body);

  const prompt = buildRewritePrompt(payload.message, payload.tone, payload.audience);
  void prompt;

  // TODO: Route to Gemini rewriting when credentials exist.
  const mock = await rewriteMessage(payload.message, payload.tone, payload.audience);
  return NextResponse.json(aiRewriteMessageResponseSchema.parse(mock));
}
