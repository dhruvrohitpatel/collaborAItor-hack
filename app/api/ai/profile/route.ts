import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { getGeminiModel } from "@/lib/ai/gemini";
import { generateProfileForStudent } from "@/lib/ai/profileGeneration";
import { aiProfileRequestSchema, aiProfileResponseSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    await requireInstructorApi();
    const body = await request.json();
    const { student } = aiProfileRequestSchema.parse(body);
    const profile = await generateProfileForStudent(student);
    const model = getGeminiModel();

    return NextResponse.json({
      ...aiProfileResponseSchema.parse(profile),
      meta: {
        provider: profile.profileSource === "ai" ? "gemini" : "mock",
        model,
        fallbackReason:
          profile.profileSource === "ai"
            ? null
            : "Gemini unavailable or request fell back to mock."
      }
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
