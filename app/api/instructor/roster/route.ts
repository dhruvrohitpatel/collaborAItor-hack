import { NextResponse } from "next/server";

import { createRosterStudent } from "@/lib/repo";
import { rosterSetupInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = rosterSetupInputSchema.parse(body);
    const student = await createRosterStudent(payload);

    return NextResponse.json({
      ok: true,
      studentId: student.id
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
