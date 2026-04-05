import {
  callGeminiForJSON,
  getGeminiModel,
  isGeminiRateLimitError
} from "@/lib/ai/gemini";
import { generateMockProfile, hasGeminiCredentials } from "@/lib/ai/mock";
import { buildBatchProfilePrompt, buildProfilePrompt } from "@/lib/ai/prompts";
import {
  aiBatchProfileResponseSchema,
  aiProfileResponseSchema
} from "@/lib/ai/schemas";
import { collaborationProfileSchema } from "@/lib/schemas";
import type { StudentIntake, StudentProfile } from "@/types/domain";

export type ProfileGenerationSummary = {
  providerUsed: "gemini" | "mixed" | "mock";
  geminiProfilesCount: number;
  mockProfilesCount: number;
  rateLimited: boolean;
  warning: string | null;
};

export type ProfileGenerationResult = {
  profiles: StudentProfile[];
  summary: ProfileGenerationSummary;
};

const SINGLE_BATCH_THRESHOLD = 12;
const DEFAULT_BATCH_SIZE = 8;

function chunkStudents(students: StudentIntake[]) {
  if (students.length <= SINGLE_BATCH_THRESHOLD) {
    return [students];
  }

  const chunks: StudentIntake[][] = [];
  for (let index = 0; index < students.length; index += DEFAULT_BATCH_SIZE) {
    chunks.push(students.slice(index, index + DEFAULT_BATCH_SIZE));
  }
  return chunks;
}

function buildSummary(geminiProfilesCount: number, mockProfilesCount: number, warning: string | null) {
  const providerUsed =
    geminiProfilesCount > 0 && mockProfilesCount > 0
      ? "mixed"
      : geminiProfilesCount > 0
        ? "gemini"
        : "mock";

  return {
    providerUsed,
    geminiProfilesCount,
    mockProfilesCount,
    rateLimited: Boolean(warning?.toLowerCase().includes("429")),
    warning
  } satisfies ProfileGenerationSummary;
}

async function buildMockProfiles(students: StudentIntake[]) {
  return Promise.all(
    students.map(async (student) => {
      const mockProfile = await generateMockProfile(student);
      return collaborationProfileSchema.parse({
        ...student,
        ...mockProfile,
        profileGeneratedAt: new Date().toISOString()
      });
    })
  );
}

function validateBatchIds(batch: StudentIntake[], returnedIds: string[]) {
  if (returnedIds.length !== batch.length) {
    throw new Error(
      `Gemini batch returned ${returnedIds.length} profiles for ${batch.length} students.`
    );
  }

  const expectedIds = new Set(batch.map((student) => student.id));
  const seenIds = new Set<string>();

  for (const id of returnedIds) {
    if (!expectedIds.has(id)) {
      throw new Error(`Gemini batch returned unknown studentId: ${id}`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Gemini batch returned duplicate studentId: ${id}`);
    }
    seenIds.add(id);
  }
}

async function generateProfileBatchWithGemini(batch: StudentIntake[]) {
  const prompt = buildBatchProfilePrompt(batch);
  const raw = await callGeminiForJSON(prompt);
  const parsed = aiBatchProfileResponseSchema.parse(raw);
  validateBatchIds(
    batch,
    parsed.profiles.map((profile) => profile.studentId)
  );

  const byStudentId = new Map(parsed.profiles.map((profile) => [profile.studentId, profile]));

  return batch.map((student) =>
    collaborationProfileSchema.parse({
      ...student,
      ...byStudentId.get(student.id),
      profileSource: "ai",
      profileGeneratedAt: new Date().toISOString()
    })
  );
}

/**
 * Single-student generation remains available for direct profile API usage and
 * low-volume fallback paths. Batched generation is the primary path used by
 * repo-level "Generate Profiles" actions.
 */
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
      console.error(
        `[profile] Gemini call failed for student ${student.id} using ${getGeminiModel()}: ${message}`
      );
    }
  }

  const mockProfile = await generateMockProfile(student);

  return collaborationProfileSchema.parse({
    ...student,
    ...mockProfile,
    profileGeneratedAt
  });
}

export async function generateProfilesForStudentsBatched(
  students: StudentIntake[]
): Promise<ProfileGenerationResult> {
  if (!students.length) {
    return {
      profiles: [],
      summary: buildSummary(0, 0, null)
    };
  }

  const geminiAvailable = hasGeminiCredentials();
  const chunks = chunkStudents(students);
  const profiles: StudentProfile[] = [];
  let geminiProfilesCount = 0;
  let mockProfilesCount = 0;
  let warning: string | null = geminiAvailable ? null : "No Gemini credentials found.";
  let disableGeminiForRun = !geminiAvailable;

  for (const chunk of chunks) {
    if (disableGeminiForRun) {
      const mockProfiles = await buildMockProfiles(chunk);
      profiles.push(...mockProfiles);
      mockProfilesCount += mockProfiles.length;
      continue;
    }

    try {
      const geminiProfiles = await generateProfileBatchWithGemini(chunk);
      profiles.push(...geminiProfiles);
      geminiProfilesCount += geminiProfiles.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[profile-batch] Gemini batch failed for ${chunk.length} students using ${getGeminiModel()}: ${message}`
      );

      if (isGeminiRateLimitError(error)) {
        disableGeminiForRun = true;
        warning =
          "Gemini hit a 429 rate limit. Remaining profiles were generated with mock fallback.";
      } else if (!warning) {
        warning = `One Gemini batch failed and was replaced with mock profiles: ${message}`;
      }

      const mockProfiles = await buildMockProfiles(chunk);
      profiles.push(...mockProfiles);
      mockProfilesCount += mockProfiles.length;
    }
  }

  return {
    profiles,
    summary: buildSummary(geminiProfilesCount, mockProfilesCount, warning)
  };
}
