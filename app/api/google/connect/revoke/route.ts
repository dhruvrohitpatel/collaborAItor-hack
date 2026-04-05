import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireStudentApi } from "@/lib/auth/guards";
import { disconnectGoogleByEmail } from "@/lib/google/connections";

export async function POST(request: Request) {
  try {
    const user = await requireStudentApi();
    await request.json().catch(() => null);

    const revoked = await disconnectGoogleByEmail(user.email);
    if (!revoked) {
      return NextResponse.json(
        { error: "No Google connection found for this email." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      memberEmail: user.email
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
