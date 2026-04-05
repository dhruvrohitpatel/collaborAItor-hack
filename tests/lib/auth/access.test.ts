import { describe, expect, it } from "vitest";

import { canAccessTeam, defaultHomeForRole } from "@/lib/auth/access";
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

describe("team access", () => {
  it("routes users to the correct home", () => {
    expect(defaultHomeForRole("instructor")).toBe("/instructor");
    expect(defaultHomeForRole("student")).toBe("/my-team");
  });

  it("permits instructors and the matching student member", () => {
    expect(canAccessTeam(createUser({ role: "instructor" }), team)).toBe(true);
    expect(canAccessTeam(createUser({ email: "Student1@Example.edu" }), team)).toBe(true);
    expect(canAccessTeam(createUser({ email: "other@example.edu" }), team)).toBe(false);
  });
});
