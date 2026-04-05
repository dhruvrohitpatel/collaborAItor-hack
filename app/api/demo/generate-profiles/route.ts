import { NextResponse } from "next/server";

import { generateProfilesForStudents } from "@/lib/repo";

export async function POST() {
  try {
    const result = await generateProfilesForStudents();

    return NextResponse.json({
      ok: true,
      profiles: result.profiles.length,
      providerUsed: result.summary.providerUsed,
      geminiProfilesCount: result.summary.geminiProfilesCount,
      mockProfilesCount: result.summary.mockProfilesCount,
      rateLimited: result.summary.rateLimited,
      warning: result.summary.warning
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
