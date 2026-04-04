import {
  collaborationProfileSchema,
  riskFlagSchema,
  studentIntakeSchema
} from "../lib/schemas";

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

const validProfile = {
  id: "s-01",
  name: "Jordan Lee",
  email: "jordan@example.edu",
  timezone: "America/Chicago",
  availability: [{ day: "Mon", start: "09:00", end: "11:00" }],
  strengths: ["systems thinking", "async communication"],
  growthAreas: ["public speaking", "conflict resolution"],
  preferredRole: "backend engineer",
  communicationStyle: "analytical",
  collaborationPreferences: ["async-first", "clear task ownership"],
  shortReflection: "I thrive when problems are well-scoped and I can work heads-down.",
  profileSummary: "Jordan is a detail-oriented backend engineer who communicates analytically.",
  inferredTags: ["async-first", "detail-oriented"],
  leadershipSignal: "emerging",
  riskFlags: [
    {
      code: "limited_availability",
      label: "Limited weekly availability",
      severity: "medium",
      note: "Only 4 h/week overlap with standard team windows"
    }
  ],
  profileSource: "ai",
  profileGeneratedAt: "2026-04-04T12:00:00.000Z"
};

console.log("\n── collaborationProfileSchema ──");

assert("accepts a fully valid profile", () => {
  collaborationProfileSchema.parse(validProfile);
});

assert("accepts profile with empty riskFlags array", () => {
  collaborationProfileSchema.parse({ ...validProfile, riskFlags: [] });
});

assert("defaults riskFlags to [] when omitted", () => {
  const result = collaborationProfileSchema.parse(
    (() => { const { riskFlags: _, ...rest } = validProfile; return rest; })()
  );
  if (result.riskFlags.length !== 0) throw new Error("riskFlags should default to []");
});

assert("rejects missing profileSummary", () => {
  const { profileSummary: _, ...bad } = validProfile;
  const result = collaborationProfileSchema.safeParse(bad);
  if (result.success) throw new Error("should have failed");
});

assert("rejects profileSummary shorter than 10 chars", () => {
  const result = collaborationProfileSchema.safeParse({ ...validProfile, profileSummary: "Short" });
  if (result.success) throw new Error("should have failed");
});

assert("rejects invalid leadershipSignal value", () => {
  const result = collaborationProfileSchema.safeParse({ ...validProfile, leadershipSignal: "expert" });
  if (result.success) throw new Error("should have failed");
});

assert("rejects invalid profileSource value", () => {
  const result = collaborationProfileSchema.safeParse({ ...validProfile, profileSource: "human" });
  if (result.success) throw new Error("should have failed");
});

assert("rejects malformed profileGeneratedAt (not ISO datetime)", () => {
  const result = collaborationProfileSchema.safeParse({ ...validProfile, profileGeneratedAt: "April 4 2026" });
  if (result.success) throw new Error("should have failed");
});

assert("rejects empty inferredTags array", () => {
  const result = collaborationProfileSchema.safeParse({ ...validProfile, inferredTags: [] });
  if (result.success) throw new Error("should have failed");
});

console.log("\n── riskFlagSchema ──");

assert("accepts valid risk flag", () => {
  riskFlagSchema.parse({ code: "comm_mono", label: "Communication monoculture", severity: "high", note: "All direct." });
});

assert("rejects invalid severity", () => {
  const result = riskFlagSchema.safeParse({ code: "x", label: "x", severity: "critical", note: "" });
  if (result.success) throw new Error("should have failed");
});

assert("rejects missing code", () => {
  const result = riskFlagSchema.safeParse({ label: "x", severity: "low", note: "" });
  if (result.success) throw new Error("should have failed");
});

console.log("\n── studentIntakeSchema (regression) ──");

assert("intake schema still rejects bad email", () => {
  const result = studentIntakeSchema.safeParse({ ...validProfile, email: "not-an-email" });
  if (result.success) throw new Error("should have failed");
});

assert("intake schema still rejects bad time format", () => {
  const result = studentIntakeSchema.safeParse({
    ...validProfile,
    availability: [{ day: "Mon", start: "9:00", end: "25:00" }]
  });
  if (result.success) throw new Error("should have failed");
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
