import { describe, expect, it } from "vitest";

import { scoreAvailabilityOverlap } from "@/lib/teamFormation";
import type { StudentProfile } from "@/types/domain";

function createProfile(id: string, availability: StudentProfile["availability"]): StudentProfile {
  return {
    id,
    name: id,
    email: `${id}@example.edu`,
    timezone: "America/Phoenix",
    availability,
    strengths: ["frontend", "planning"],
    growthAreas: ["testing"],
    preferredRole: "Contributor",
    communicationStyle: "collaborative",
    collaborationPreferences: ["shared docs"],
    shortReflection: "Demo profile",
    profileSummary: "Demo profile",
    inferredTags: ["frontend"],
    leadershipSignal: "medium",
    riskFlags: [],
    profileSource: "mock",
    profileGeneratedAt: "2026-04-05T00:00:00.000Z"
  };
}

describe("availability overlap scoring", () => {
  it("scores exact overlap positively", () => {
    const score = scoreAvailabilityOverlap([
      createProfile("stu-1", [{ day: "Tue", start: "16:00", end: "18:00" }]),
      createProfile("stu-2", [{ day: "Tue", start: "16:00", end: "18:00" }])
    ]);

    expect(score).toBe(100);
  });

  it("scores partial same-day overlap positively", () => {
    const score = scoreAvailabilityOverlap([
      createProfile("stu-1", [{ day: "Tue", start: "16:00", end: "18:00" }]),
      createProfile("stu-2", [{ day: "Tue", start: "17:00", end: "19:00" }])
    ]);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it("treats adjacent slots as no overlap", () => {
    const score = scoreAvailabilityOverlap([
      createProfile("stu-1", [{ day: "Tue", start: "16:00", end: "18:00" }]),
      createProfile("stu-2", [{ day: "Tue", start: "18:00", end: "20:00" }])
    ]);

    expect(score).toBe(0);
  });

  it("treats different days as no overlap", () => {
    const score = scoreAvailabilityOverlap([
      createProfile("stu-1", [{ day: "Tue", start: "16:00", end: "18:00" }]),
      createProfile("stu-2", [{ day: "Wed", start: "16:00", end: "18:00" }])
    ]);

    expect(score).toBe(0);
  });
});
