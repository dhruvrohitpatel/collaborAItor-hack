import { NextResponse } from "next/server";

import { getGeminiModel } from "@/lib/ai/gemini";
import { generateProfileForStudent } from "@/lib/ai/profileGeneration";
import { aiProfileRequestSchema, aiProfileResponseSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { student } = aiProfileRequestSchema.parse(body);
  const profile = await generateProfileForStudent(student);
  const model = getGeminiModel();

  return NextResponse.json({
    ...aiProfileResponseSchema.parse(profile),
    meta: {
      provider: profile.profileSource === "ai" ? "gemini" : "mock",
      model,
      fallbackReason: profile.profileSource === "ai" ? null : "Gemini unavailable or request fell back to mock."
    }
  });
}
