import { NextResponse } from "next/server";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireInstructorApi } from "@/lib/auth/guards";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

type RouteContext = {
  params: {
    teamId: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
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

    const teamId = params.teamId;
    const teamRef = doc(db, "teams", teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      return NextResponse.json(
        {
          ok: false,
          teamId,
          teamExists: false,
          error: `Team "${teamId}" was not found.`
        },
        { status: 404 }
      );
    }

    const [tasksSnapshot, meetingsSnapshot, copilotRunsSnapshot] = await Promise.all([
      getDocs(collection(db, "teams", teamId, "tasks")),
      getDocs(collection(db, "teams", teamId, "meetings")),
      getDocs(collection(db, "teams", teamId, "copilot_runs"))
    ]);

    const teamData = teamDoc.data() as Record<string, unknown>;

    return NextResponse.json({
      ok: true,
      teamId,
      teamExists: true,
      topLevelFields: {
        projectTheme: teamData.projectTheme ?? null,
        currentMilestone: teamData.currentMilestone ?? null,
        preferredMeetingDurationMin: teamData.preferredMeetingDurationMin ?? null,
        aiOptIn: teamData.aiOptIn ?? null,
        teamNorms: teamData.teamNorms ?? null,
        lastPulseAt: teamData.lastPulseAt ?? null,
        activeMeetingId: teamData.activeMeetingId ?? null
      },
      tasksCount: tasksSnapshot.size,
      meetingsCount: meetingsSnapshot.size,
      copilotRunsCount: copilotRunsSnapshot.size,
      sampleTask: tasksSnapshot.docs[0]
        ? { id: tasksSnapshot.docs[0].id, ...tasksSnapshot.docs[0].data() }
        : null,
      sampleMeeting: meetingsSnapshot.docs[0]
        ? { id: meetingsSnapshot.docs[0].id, ...meetingsSnapshot.docs[0].data() }
        : null,
      sampleCopilotRun: copilotRunsSnapshot.docs[0]
        ? { id: copilotRunsSnapshot.docs[0].id, ...copilotRunsSnapshot.docs[0].data() }
        : null
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
