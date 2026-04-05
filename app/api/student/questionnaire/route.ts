import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireStudentApi } from "@/lib/auth/guards";
import { submitStudentQuestionnaire } from "@/lib/repo";
import { questionnaireSubmissionSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const user = await requireStudentApi();
    const body = await request.json();
    const payload = questionnaireSubmissionSchema.parse({
      ...body,
      email: user.email
    });
    const student = await submitStudentQuestionnaire(payload);

    return NextResponse.json({
      ok: true,
      studentId: student.id
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
