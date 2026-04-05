import { NextResponse } from "next/server";

import { generateMeetingSummary } from "@/lib/ai/meetingSummary";
import { aiSummarizeMeetingRequestSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { notes } = aiSummarizeMeetingRequestSchema.parse(body);
  const result = await generateMeetingSummary(notes);
  return NextResponse.json({
    ...result.data,
    meta: result.meta
  });
}
