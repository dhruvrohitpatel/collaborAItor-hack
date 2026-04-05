import { NextResponse } from "next/server";

import { generateProfileForStudent } from "@/lib/ai/profileGeneration";
import { aiProfileRequestSchema, aiProfileResponseSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { student } = aiProfileRequestSchema.parse(body);
  const profile = await generateProfileForStudent(student);

  return NextResponse.json(aiProfileResponseSchema.parse(profile));
}
