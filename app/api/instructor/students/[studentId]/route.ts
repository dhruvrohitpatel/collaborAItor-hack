import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { updateStudentIntake } from "@/lib/repo";
import { studentIntakeSchema } from "@/lib/schemas";

type RouteContext = {
  params: {
    studentId: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireInstructorApi();
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
    return authErrorResponse(error);
  }
}
