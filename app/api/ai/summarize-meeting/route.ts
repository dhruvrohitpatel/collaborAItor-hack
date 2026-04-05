import { NextResponse } from "next/server";

import { callGeminiForJSON } from "@/lib/ai/gemini";
import { hasGeminiCredentials, summarizeMeetingNotes } from "@/lib/ai/mock";
import { buildMeetingSummaryPrompt } from "@/lib/ai/prompts";
import {
  aiSummarizeMeetingRequestSchema,
  aiSummarizeMeetingResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { notes } = aiSummarizeMeetingRequestSchema.parse(body);

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildMeetingSummaryPrompt(notes);
      const raw = await callGeminiForJSON(prompt);

      const validated = aiSummarizeMeetingResponseSchema.parse(raw);
      return NextResponse.json(validated);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[summarize-meeting] Gemini call failed: ${message}`);
      // Fall through to deterministic mock.
    }
  }

  const mock = await summarizeMeetingNotes(notes);
  return NextResponse.json(aiSummarizeMeetingResponseSchema.parse(mock));
}
