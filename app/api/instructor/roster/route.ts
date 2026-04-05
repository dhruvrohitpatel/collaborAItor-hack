import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { createRosterStudent } from "@/lib/repo";
import { rosterSetupInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    await requireInstructorApi();
    const body = await request.json();
    const payload = rosterSetupInputSchema.parse(body);
    const student = await createRosterStudent(payload);

    return NextResponse.json({
      ok: true,
      studentId: student.id
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
