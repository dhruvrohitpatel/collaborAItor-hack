import { callGeminiForJSON } from "@/lib/ai/gemini";
import { generateMockProfile, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildProfilePrompt } from "@/lib/ai/prompts";
import { aiProfileResponseSchema } from "@/lib/ai/schemas";
import { collaborationProfileSchema } from "@/lib/schemas";
import type { StudentIntake, StudentProfile } from "@/types/domain";

export async function generateProfileForStudent(student: StudentIntake): Promise<StudentProfile> {
  const profileGeneratedAt = new Date().toISOString();

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildProfilePrompt(student);
      const raw = await callGeminiForJSON(prompt);
      const aiProfile = aiProfileResponseSchema.parse({
        ...(raw as object),
        profileSource: "ai"
      });

      return collaborationProfileSchema.parse({
        ...student,
        ...aiProfile,
        profileGeneratedAt
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[profile] Gemini call failed for student ${student.id}: ${message}`);
    }
  }

  const mockProfile = await generateMockProfile(student);

  return collaborationProfileSchema.parse({
    ...student,
    ...mockProfile,
    profileGeneratedAt
  });
}
