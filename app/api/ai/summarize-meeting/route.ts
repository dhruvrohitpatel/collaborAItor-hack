import { NextResponse } from "next/server";

import { summarizeMeetingNotes } from "@/lib/ai/mock";
import { buildMeetingSummaryPrompt } from "@/lib/ai/prompts";
import {
  aiSummarizeMeetingRequestSchema,
  aiSummarizeMeetingResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiSummarizeMeetingRequestSchema.parse(body);

  const prompt = buildMeetingSummaryPrompt(payload.notes);
  void prompt;

  // TODO: Route to Gemini summarization when credentials exist.
  const mock = await summarizeMeetingNotes(payload.notes);
  return NextResponse.json(aiSummarizeMeetingResponseSchema.parse(mock));
}
