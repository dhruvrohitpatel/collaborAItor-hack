import { NextResponse } from "next/server";
import { doc, writeBatch } from "firebase/firestore";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { getExpandedStudents } from "@/lib/demo-seed";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

export async function GET() {
  try {
    await requireInstructorApi();
    if (!isFirebaseConfigured) {
      return NextResponse.json(
        { ok: false, error: "Firebase env vars are not configured." },
        { status: 500 }
      );
    }

    const db = getFirestoreDb();

    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Firestore failed to initialize." },
        { status: 500 }
      );
    }

    const batch = writeBatch(db);

    const expandedStudents = getExpandedStudents();

    for (const student of expandedStudents) {
      batch.set(doc(db, "students", student.id), student);
    }

    await batch.commit();

    return NextResponse.json({
      ok: true,
      seeded: expandedStudents.length,
      message: "Seeded students into Firestore."
    });
  } catch (error: unknown) {
    console.error("Seed students route error:", error);
    return authErrorResponse(error);
  }
}
