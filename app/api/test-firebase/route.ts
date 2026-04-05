import { NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

export const dynamic = "force-dynamic";

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

    const ref = doc(db, "connectionTests", "test-doc");

    await setDoc(ref, {
      message: "Firebase connection successful",
      createdAt: serverTimestamp()
    });

    return NextResponse.json({
      ok: true,
      message: "Test document written to Firestore."
    });
  } catch (error) {
    console.error("Firebase test route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}