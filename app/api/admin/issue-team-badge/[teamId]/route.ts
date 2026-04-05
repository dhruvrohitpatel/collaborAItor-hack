import { NextResponse } from "next/server";

import { issueOrUpdateTeamBadge } from "@/lib/repo";

type RouteContext = {
  params: {
    teamId: string;
  };
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const badge = await issueOrUpdateTeamBadge(params.teamId);

    return NextResponse.json({
      ok: true,
      badge
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
