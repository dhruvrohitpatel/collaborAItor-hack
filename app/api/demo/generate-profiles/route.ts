import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { generateProfilesForStudents } from "@/lib/repo";

export async function POST() {
  try {
    await requireInstructorApi();
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
    return authErrorResponse(error);
  }
}
