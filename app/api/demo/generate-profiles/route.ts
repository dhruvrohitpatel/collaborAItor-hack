import { NextResponse } from "next/server";

import { generateProfilesForStudents } from "@/lib/repo";

export async function POST() {
  try {
    const profiles = await generateProfilesForStudents();

    return NextResponse.json({
      ok: true,
      profiles: profiles.length
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
