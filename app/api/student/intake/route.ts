import { NextResponse } from "next/server";

import { addStudentIntake } from "@/lib/repo";
import { studentIntakeSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = studentIntakeSchema.parse(body);

  const student = await addStudentIntake(payload);

  return NextResponse.json({
    ok: true,
    studentId: student.id
  });
}
