import { NextResponse } from "next/server";

import { resolveTeamMoveRequest } from "@/lib/repo";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await resolveTeamMoveRequest(body);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    if (result.status === "destination_full") {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
