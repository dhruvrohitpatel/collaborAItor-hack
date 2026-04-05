import { NextResponse } from "next/server";

import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { hasGeminiCredentials, summarizeMeetingNotes } from "@/lib/ai/mock";
import { buildMeetingSummaryPrompt } from "@/lib/ai/prompts";
import {
  aiSummarizeMeetingRequestSchema,
  aiSummarizeMeetingResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { notes } = aiSummarizeMeetingRequestSchema.parse(body);
  const model = getGeminiModel();

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildMeetingSummaryPrompt(notes);
      const raw = await callGeminiForJSON(prompt);

      const validated = aiSummarizeMeetingResponseSchema.parse(raw);
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
      console.error(`[summarize-meeting] Gemini call failed: ${message}`);
      const mock = await summarizeMeetingNotes(notes);
      return NextResponse.json({
        ...aiSummarizeMeetingResponseSchema.parse(mock),
        meta: {
          provider: "mock",
          model,
          fallbackReason: message
        }
      });
    }
  }

  const mock = await summarizeMeetingNotes(notes);
  return NextResponse.json({
    ...aiSummarizeMeetingResponseSchema.parse(mock),
    meta: {
      provider: "mock",
      model,
      fallbackReason: "No Gemini credentials found."
    }
  });
}
