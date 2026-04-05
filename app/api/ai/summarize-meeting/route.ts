import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { generateMeetingSummary } from "@/lib/ai/meetingSummary";
import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { aiSummarizeMeetingRequestSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    await requireInstructorApi();
    const body = await request.json();
    const { notes } = aiSummarizeMeetingRequestSchema.parse(body);
    const result = await generateMeetingSummary(notes);

    return NextResponse.json({
      ...result.data,
      meta: result.meta
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
