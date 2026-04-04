/**
 * Exercises the profile generation logic (mock path + schema validation)
 * without starting the Next.js server.
 */
import { generateMockProfile } from "../lib/ai/mock";
import { buildProfilePrompt } from "../lib/ai/prompts";
import { aiProfileResponseSchema } from "../lib/ai/schemas";

let passed = 0;
let failed = 0;

function assert(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${label}\n    ${e.message}`);
    failed++;
  }
}

const student = {
  id: "s-01",
  name: "Jordan Lee",
  email: "jordan@example.edu",
  timezone: "America/Chicago",
  availability: [{ day: "Mon" as const, start: "09:00", end: "11:00" }],
  strengths: ["systems thinking", "async comms"],
  growthAreas: ["public speaking"],
  preferredRole: "backend engineer",
  communicationStyle: "analytical" as const,
  collaborationPreferences: ["async-first"],
  shortReflection: "I thrive when problems are well-scoped and I can work heads-down."
};

async function main() {
  console.log("\n── buildProfilePrompt ──");

  const prompt = buildProfilePrompt(student);

  assert("prompt includes student name", () => {
    if (!prompt.includes(student.name)) throw new Error("name missing");
  });
  assert("prompt includes JSON shape spec", () => {
    if (!prompt.includes("profileSummary")) throw new Error("schema spec missing");
  });
  assert("prompt includes riskFlags spec", () => {
    if (!prompt.includes("riskFlags")) throw new Error("riskFlags missing from prompt");
  });
  assert("prompt does NOT include student email (PII guard)", () => {
    if (prompt.includes(student.email)) throw new Error("email should not appear in prompt");
  });
  assert("prompt includes all availability slots", () => {
    if (!prompt.includes("Mon 09:00-11:00")) throw new Error("availability missing");
  });

  console.log("\n── mock fallback path ──");

  const mock = await generateMockProfile(student);

  assert("mock profileSummary is non-empty", () => {
    if (!mock.profileSummary) throw new Error("empty profileSummary");
  });
  assert("mock inferredTags is non-empty array", () => {
    if (!Array.isArray(mock.inferredTags) || mock.inferredTags.length === 0)
      throw new Error("empty inferredTags");
  });
  assert("mock leadershipSignal is valid enum", () => {
    if (!["high", "medium", "emerging"].includes(mock.leadershipSignal))
      throw new Error(`bad leadershipSignal: ${mock.leadershipSignal}`);
  });
  assert("mock profileSource is 'mock'", () => {
    if (mock.profileSource !== "mock") throw new Error(`expected mock, got ${mock.profileSource}`);
  });

  console.log("\n── aiProfileResponseSchema validation ──");

  assert("mock response passes aiProfileResponseSchema", () => {
    aiProfileResponseSchema.parse(mock);
  });
  assert("ai source override passes schema", () => {
    aiProfileResponseSchema.parse({ ...mock, profileSource: "ai" });
  });
  assert("schema rejects empty inferredTags", () => {
    const result = aiProfileResponseSchema.safeParse({ ...mock, inferredTags: [] });
    if (result.success) throw new Error("should have rejected");
  });
  assert("schema rejects bad leadershipSignal", () => {
    const result = aiProfileResponseSchema.safeParse({ ...mock, leadershipSignal: "expert" });
    if (result.success) throw new Error("should have rejected");
  });
  assert("schema accepts riskFlags array from Gemini response", () => {
    aiProfileResponseSchema.parse({
      ...mock,
      profileSource: "ai",
      riskFlags: [{ code: "limited_avail", label: "Limited availability", severity: "medium", note: "4h/wk only" }]
    });
  });

  console.log("\n── determinism ──");

  const mock2 = await generateMockProfile(student);
  assert("mock is deterministic across calls", () => {
    if (mock.profileSummary !== mock2.profileSummary)
      throw new Error("non-deterministic mock output");
  });

  console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
