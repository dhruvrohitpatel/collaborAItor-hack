import { normalizeEmail, parseEmailList } from "@/lib/email";
import type { AppRole } from "@/lib/auth/types";

export type RoleAllowlist = {
  instructor: Set<string>;
  student: Set<string>;
};

type RoleEnv = {
  ALLOWED_INSTRUCTOR_EMAILS?: string;
  ALLOWED_STUDENT_EMAILS?: string;
};

export function getRoleAllowlistFromEnv(env?: RoleEnv): RoleAllowlist {
  const source = env ?? process.env;

  return {
    instructor: new Set(parseEmailList(source.ALLOWED_INSTRUCTOR_EMAILS)),
    student: new Set(parseEmailList(source.ALLOWED_STUDENT_EMAILS))
  };
}

export function resolveRoleForEmail(
  email: string,
  allowlist: RoleAllowlist = getRoleAllowlistFromEnv()
): AppRole | null {
  const normalized = normalizeEmail(email);

  if (allowlist.instructor.has(normalized)) {
    return "instructor";
  }

  if (allowlist.student.has(normalized)) {
    return "student";
  }

  return null;
}
