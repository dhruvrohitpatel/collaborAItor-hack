import { NextResponse } from "next/server";

import {
  hasElevenLabsCredentials,
  synthesizeSpeechWithElevenLabs
} from "@/lib/ai/elevenlabs";
import {
  buildMeetingSummaryAudioScript,
  generateMeetingSummary
} from "@/lib/ai/meetingSummary";
import { aiSummarizeMeetingRequestSchema } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notes } = aiSummarizeMeetingRequestSchema.parse(body);

    if (!hasElevenLabsCredentials()) {
      return NextResponse.json(
        {
          ok: false,
          error: "ElevenLabs is not configured. Set ELEVENLABS_API_KEY."
        },
        { status: 500 }
      );
    }

    const result = await generateMeetingSummary(notes);
    const script = buildMeetingSummaryAudioScript(result.data);
    const audioBuffer = await synthesizeSpeechWithElevenLabs(script);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-AI-Provider": result.meta.provider,
        "X-AI-Model": result.meta.model
      }
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown audio generation error"
      },
      { status: 500 }
    );
  }
}
