import { describe, expect, it } from "vitest";

import { getRoleAllowlistFromEnv, resolveRoleForEmail } from "@/lib/auth/roles";

describe("auth roles", () => {
  it("parses allowlists and resolves roles case-insensitively", () => {
    const allowlist = getRoleAllowlistFromEnv({
      ALLOWED_INSTRUCTOR_EMAILS: "Instructor@Example.edu, coach@example.edu",
      ALLOWED_STUDENT_EMAILS: "Student1@Example.edu,student2@example.edu"
    });

    expect(resolveRoleForEmail(" instructor@example.edu ", allowlist)).toBe("instructor");
    expect(resolveRoleForEmail("STUDENT1@example.edu", allowlist)).toBe("student");
    expect(resolveRoleForEmail("outsider@example.edu", allowlist)).toBeNull();
  });
});
