import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { issueOrUpdateTeamBadge } from "@/lib/repo";

type RouteContext = {
  params: {
    teamId: string;
  };
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    await requireInstructorApi();
    const badge = await issueOrUpdateTeamBadge(params.teamId);

    return NextResponse.json({
      ok: true,
      badge
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
