import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { loadDemoSeed } from "@/lib/repo";

export async function POST() {
  try {
    await requireInstructorApi();
    const state = await loadDemoSeed();

    return NextResponse.json({
      ok: true,
      students: state.students.length,
      profiles: state.profiles.length,
      teams: state.teams.length
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
