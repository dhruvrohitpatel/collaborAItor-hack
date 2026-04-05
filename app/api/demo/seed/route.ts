import { NextResponse } from "next/server";

import { loadDemoSeed } from "@/lib/repo";

export async function POST() {
  try {
    const state = await loadDemoSeed();

    return NextResponse.json({
      ok: true,
      students: state.students.length,
      profiles: state.profiles.length,
      teams: state.teams.length
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
