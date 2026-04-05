import { NextResponse } from "next/server";

import { getGoogleConnectionStatusByEmails } from "@/lib/google/connections";
import { getTeamById } from "@/lib/repo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  if (!teamId) {
    return NextResponse.json({ error: "teamId is required." }, { status: 400 });
  }

  const team = await getTeamById(teamId);
  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const memberEmails = team.members.map((member) => member.email);
  const status = await getGoogleConnectionStatusByEmails(memberEmails);
  const connectedSet = new Set(status.connectedEmails);

  return NextResponse.json({
    teamId,
    members: team.members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      connected: connectedSet.has(member.email.toLowerCase())
    })),
    membersMissingGoogle: status.membersMissingGoogle
  });
}
