import { NextResponse } from "next/server";

import { generateMockProfile, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildProfilePrompt } from "@/lib/ai/prompts";
import {
  aiProfileRequestSchema,
  aiProfileResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { student } = aiProfileRequestSchema.parse(body);

  const prompt = buildProfilePrompt(student);

  if (hasGeminiCredentials()) {
    // TODO: Replace this mock fallback with a real Vertex AI / Gemini call.
    // Keep prompt usage explicit so integration can be dropped in quickly.
    void prompt;

    const generated = await generateMockProfile(student);
    return NextResponse.json(
      aiProfileResponseSchema.parse({
        ...generated,
        profileSource: "ai"
      })
    );
  }

  const mock = await generateMockProfile(student);
  return NextResponse.json(aiProfileResponseSchema.parse(mock));
}
