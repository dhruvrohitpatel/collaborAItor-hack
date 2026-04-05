import { NextResponse } from "next/server";
import { doc, writeBatch } from "firebase/firestore";

import { expandedStudents } from "@/data/generateExpandedStudents";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

export async function GET() {
  try {
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

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
