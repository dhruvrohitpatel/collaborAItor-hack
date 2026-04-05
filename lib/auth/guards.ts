import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { canAccessTeam, defaultHomeForRole } from "@/lib/auth/access";
import { getTeamById, getTeamByMemberEmail } from "@/lib/repo";
import {
  AuthError,
  getOptionalSessionUser,
  requireRole,
  requireSessionUser,
  type AppRole,
  type SessionUser
} from "@/lib/auth/session";

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}

export async function requirePageUser() {
  const user = await getOptionalSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requirePageRole(role: AppRole) {
  const user = await requirePageUser();
  if (user.role !== role) {
    redirect(defaultHomeForRole(user.role));
  }
  return user;
}

export async function requireInstructorPage() {
  return requirePageRole("instructor");
}

export async function requireStudentPage() {
  return requirePageRole("student");
}

export async function requirePageTeamAccess(teamId: string) {
  const user = await requirePageUser();
  const team = await getTeamById(teamId);

  if (!team) {
    redirect(defaultHomeForRole(user.role));
  }

  if (!canAccessTeam(user, team)) {
    redirect(defaultHomeForRole(user.role));
  }

  return { user, team };
}

export async function requireInstructorApi() {
  return requireRole("instructor");
}

export async function requireStudentApi() {
  return requireRole("student");
}

export async function requireUserApi() {
  return requireSessionUser();
}

export async function requireApiTeamAccess(teamId: string): Promise<{ user: SessionUser }> {
  const user = await requireSessionUser();
  const team = await getTeamById(teamId);

  if (!team) {
    throw new AuthError(404, "Team not found.");
  }

  if (!canAccessTeam(user, team)) {
    throw new AuthError(403, "You do not have access to this team.");
  }

  return { user };
}

export async function requireCurrentStudentTeam() {
  const user = await requireStudentPage();
  const team = await getTeamByMemberEmail(user.email);

  return {
    user,
    team
  };
}
