import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { resolveTeamMoveRequest } from "@/lib/repo";

export async function POST(request: Request) {
  try {
    await requireInstructorApi();
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
    return authErrorResponse(error);
  }
}
