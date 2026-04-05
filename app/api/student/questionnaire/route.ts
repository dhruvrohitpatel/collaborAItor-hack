import { NextResponse } from "next/server";

import { submitStudentQuestionnaire } from "@/lib/repo";
import { questionnaireSubmissionSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = questionnaireSubmissionSchema.parse(body);
    const student = await submitStudentQuestionnaire(payload);

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
