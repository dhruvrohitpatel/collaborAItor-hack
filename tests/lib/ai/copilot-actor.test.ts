import { describe, expect, it } from "vitest";

import { resolveCopilotActorStudentId } from "@/lib/ai/copilot-actor";
import type { SessionUser } from "@/lib/auth/types";
import type { Team } from "@/types/domain";

const team = {
  id: "team-1",
  members: [
    { id: "stu-1", email: "student1@example.edu" },
    { id: "stu-2", email: "student2@example.edu" }
  ]
} as Team;

function createUser(partial: Partial<SessionUser>): SessionUser {
  return {
    uid: "user-1",
    email: "student1@example.edu",
    role: "student",
    name: null,
    picture: null,
    emailVerified: true,
    ...partial
  };
}

describe("copilot actor resolution", () => {
  it("uses the signed-in student instead of a default team member", () => {
    expect(resolveCopilotActorStudentId(team, createUser({ email: "Student2@example.edu" }))).toBe(
      "stu-2"
    );
  });

  it("returns null for instructors or non-members", () => {
    expect(resolveCopilotActorStudentId(team, createUser({ role: "instructor" }))).toBeNull();
    expect(resolveCopilotActorStudentId(team, createUser({ email: "other@example.edu" }))).toBeNull();
  });
});
