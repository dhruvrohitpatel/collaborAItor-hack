import { normalizeEmail } from "@/lib/email";
import type { AppRole, SessionUser } from "@/lib/auth/types";
import type { Team } from "@/types/domain";

export function defaultHomeForRole(role: AppRole) {
  return role === "instructor" ? "/instructor" : "/my-team";
}

export function isTeamMember(team: Team, email: string) {
  const normalized = normalizeEmail(email);
  return team.members.some((member) => normalizeEmail(member.email) === normalized);
}

export function canAccessTeam(user: SessionUser, team: Team) {
  return user.role === "instructor" || isTeamMember(team, user.email);
}
