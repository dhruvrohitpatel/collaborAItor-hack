import { NextResponse } from "next/server";

import { callGeminiForJSON } from "@/lib/ai/gemini";
import { generateMockProfile, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildProfilePrompt } from "@/lib/ai/prompts";
import {
  aiProfileRequestSchema,
  aiProfileResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { student } = aiProfileRequestSchema.parse(body);

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildProfilePrompt(student);
      const raw = await callGeminiForJSON(prompt);

      const validated = aiProfileResponseSchema.parse({
        ...(raw as object),
        profileSource: "ai"
      });

      return NextResponse.json(validated);
    } catch (err) {
      // Log enough context to diagnose without leaking prompt content or PII.
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[profile] Gemini call failed for student ${student.id}: ${message}`);
      // Fall through to deterministic mock so the demo never breaks.
    }
  }

  const mock = await generateMockProfile(student);
  return NextResponse.json(aiProfileResponseSchema.parse(mock));
}
