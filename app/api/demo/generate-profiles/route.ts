import { NextResponse } from "next/server";

import { generateProfilesForStudents } from "@/lib/repo";

export async function POST() {
  const profiles = await generateProfilesForStudents();

  return NextResponse.json({
    ok: true,
    profiles: profiles.length
  });
}
