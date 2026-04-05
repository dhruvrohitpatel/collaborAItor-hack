import { NextResponse } from "next/server";

import { addStudentIntake } from "@/lib/repo";
import { studentIntakeSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = studentIntakeSchema.parse(body);

    const student = await addStudentIntake(payload);

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
