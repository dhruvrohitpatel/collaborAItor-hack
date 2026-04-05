import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { hasGeminiCredentials, rewriteMessage } from "@/lib/ai/mock";
import { buildRewritePrompt } from "@/lib/ai/prompts";
import {
  aiRewriteMessageRequestSchema,
  aiRewriteMessageResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    await requireInstructorApi();
    const body = await request.json();
    const { message, tone, audience } = aiRewriteMessageRequestSchema.parse(body);
    const model = getGeminiModel();

    if (hasGeminiCredentials()) {
      try {
        const prompt = buildRewritePrompt(message, tone, audience);
        const raw = await callGeminiForJSON(prompt);

        const validated = aiRewriteMessageResponseSchema.parse(raw);
        return NextResponse.json({
          ...validated,
          meta: {
            provider: "gemini",
            model,
            fallbackReason: null
          }
        });
      } catch (err) {
        const messageErr = err instanceof Error ? err.message : String(err);
        console.error(`[rewrite-message] Gemini call failed: ${messageErr}`);
        const mock = await rewriteMessage(message, tone, audience);
        return NextResponse.json({
          ...aiRewriteMessageResponseSchema.parse(mock),
          meta: {
            provider: "mock",
            model,
            fallbackReason: messageErr
          }
        });
      }
    }

    const mock = await rewriteMessage(message, tone, audience);
    return NextResponse.json({
      ...aiRewriteMessageResponseSchema.parse(mock),
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
