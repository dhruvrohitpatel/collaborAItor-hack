import { normalizeEmail } from "@/lib/email";
import type { SessionUser } from "@/lib/auth/types";
import type { Team } from "@/types/domain";

export function resolveCopilotActorStudentId(team: Team, user: SessionUser) {
  if (user.role !== "student") {
    return null;
  }

  const normalizedEmail = normalizeEmail(user.email);
  return (
    team.members.find((member) => normalizeEmail(member.email) === normalizedEmail)?.id ?? null
  );
}
