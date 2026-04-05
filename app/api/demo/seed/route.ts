import { NextResponse } from "next/server";

import { loadDemoSeed } from "@/lib/repo";

export async function POST() {
  const state = await loadDemoSeed();

  return NextResponse.json({
    ok: true,
    students: state.students.length,
    profiles: state.profiles.length,
    teams: state.teams.length
  });
}
