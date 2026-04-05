import { NextResponse } from "next/server";

import { updateStudentIntake } from "@/lib/repo";
import { studentIntakeSchema } from "@/lib/schemas";

type RouteContext = {
  params: {
    studentId: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const payload = studentIntakeSchema.parse({
      ...body,
      id: params.studentId
    });

    const student = await updateStudentIntake(payload);

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
      { status: 400 }
    );
  }
}
