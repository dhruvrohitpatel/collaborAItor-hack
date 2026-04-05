import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";

import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { BadgeCredentialInput, DemoStateMetaInput } from "@/lib/schemas";
import {
  badgeCredentialSchema,
  collaborationProfileSchema,
  demoStateMetaSchema,
  studentIntakeSchema,
  teamCopilotRunSchema,
  teamMeetingSchema,
  teamTaskSchema,
  teamSchema
} from "@/lib/schemas";
import type {
  BadgeCredential,
  StudentIntake,
  StudentProfile,
  Team,
  TeamCopilotRun,
  TeamMeeting,
  TeamTask
} from "@/types/domain";

const META_COLLECTION = "meta";
const DEMO_STATE_META_DOC = "demo-state";
const BADGES_COLLECTION = "badges";

function getConfiguredFirestoreDb() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firestore is not configured. Set the required NEXT_PUBLIC_FIREBASE_* environment variables or enable USE_MOCK_DATA=true."
    );
  }

  const db = getFirestoreDb();

  if (!db) {
    throw new Error(
      "Firestore failed to initialize. Check your Firebase configuration or enable USE_MOCK_DATA=true."
    );
  }

  return db;
}

function getTeamSubcollection<T extends { id: string }>(
  teamId: string,
  subcollectionName: "tasks" | "meetings" | "copilot_runs",
  parse: (value: unknown) => T
) {
  return async () => {
    const db = getConfiguredFirestoreDb();
    const snapshot = await getDocs(collection(db, "teams", teamId, subcollectionName));

    return snapshot.docs
      .map((itemDoc) =>
        parse({
          ...itemDoc.data(),
          id: itemDoc.id
        })
      )
      .sort((left, right) => left.id.localeCompare(right.id));
  };
}

async function syncTeamSubcollection<T extends { id: string }>(
  teamId: string,
  subcollectionName: "tasks" | "meetings" | "copilot_runs",
  items: T[],
  parse: (value: unknown) => T
) {
  const db = getConfiguredFirestoreDb();
  const validatedItems = items.map((item) => parse(item));
  const validIds = new Set(validatedItems.map((item) => item.id));
  const existingSnapshot = await getDocs(collection(db, "teams", teamId, subcollectionName));
  const batch = writeBatch(db);

  for (const existingDoc of existingSnapshot.docs) {
    if (!validIds.has(existingDoc.id)) {
      batch.delete(existingDoc.ref);
    }
  }

  for (const item of validatedItems) {
    batch.set(doc(db, "teams", teamId, subcollectionName, item.id), item);
  }

  await batch.commit();

  return validatedItems;
}

export async function getFirestoreStudents(): Promise<StudentIntake[]> {
  const db = getConfiguredFirestoreDb();
  const snapshot = await getDocs(collection(db, "students"));

  return snapshot.docs
    .map((studentDoc) =>
      studentIntakeSchema.parse({
        ...studentDoc.data(),
        id: studentDoc.id
      })
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

export async function addFirestoreStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  const db = getConfiguredFirestoreDb();
  const student = studentIntakeSchema.parse(input);

  await setDoc(doc(db, "students", student.id), student);

  return student;
}

export async function updateFirestoreStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  const db = getConfiguredFirestoreDb();
  const student = studentIntakeSchema.parse(input);

  await setDoc(doc(db, "students", student.id), student);

  return student;
}

export async function getFirestoreProfiles(): Promise<StudentProfile[]> {
  const db = getConfiguredFirestoreDb();
  const snapshot = await getDocs(collection(db, "profiles"));

  return snapshot.docs
    .map((profileDoc) =>
      collaborationProfileSchema.parse({
        ...profileDoc.data(),
        id: profileDoc.id
      })
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

export async function saveFirestoreProfiles(profiles: StudentProfile[]): Promise<StudentProfile[]> {
  const db = getConfiguredFirestoreDb();
  const validatedProfiles = profiles.map((profile) => collaborationProfileSchema.parse(profile));
  const validIds = new Set(validatedProfiles.map((profile) => profile.id));
  const existingSnapshot = await getDocs(collection(db, "profiles"));
  const batch = writeBatch(db);

  for (const profileDoc of existingSnapshot.docs) {
    if (!validIds.has(profileDoc.id)) {
      batch.delete(profileDoc.ref);
    }
  }

  for (const profile of validatedProfiles) {
    batch.set(doc(db, "profiles", profile.id), profile);
  }

  await batch.commit();

  return validatedProfiles;
}

export async function getFirestoreTeams(): Promise<Team[]> {
  const db = getConfiguredFirestoreDb();
  const snapshot = await getDocs(collection(db, "teams"));

  return snapshot.docs
    .map((teamDoc) =>
      teamSchema.parse({
        ...teamDoc.data(),
        id: teamDoc.id
      })
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

export async function getFirestoreTeamById(teamId: string): Promise<Team | null> {
  const db = getConfiguredFirestoreDb();
  const teamDoc = await getDoc(doc(db, "teams", teamId));

  if (!teamDoc.exists()) {
    return null;
  }

  return teamSchema.parse({
    ...teamDoc.data(),
    id: teamDoc.id
  });
}

export async function clearFirestoreTeams(): Promise<void> {
  const db = getConfiguredFirestoreDb();
  const snapshot = await getDocs(collection(db, "teams"));

  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  for (const teamDoc of snapshot.docs) {
    batch.delete(teamDoc.ref);
  }

  await batch.commit();
}

export async function saveFirestoreTeams(teams: Team[]): Promise<Team[]> {
  const db = getConfiguredFirestoreDb();
  const validatedTeams = teams.map((team) => teamSchema.parse(team));
  const batch = writeBatch(db);

  for (const team of validatedTeams) {
    batch.set(doc(db, "teams", team.id), team);
  }

  await batch.commit();

  return validatedTeams;
}

export const getFirestoreTeamTasks = (teamId: string) =>
  getTeamSubcollection(teamId, "tasks", (value) => teamTaskSchema.parse(value))();

export async function saveFirestoreTeamTasks(teamId: string, tasks: TeamTask[]): Promise<TeamTask[]> {
  return syncTeamSubcollection(teamId, "tasks", tasks, (value) => teamTaskSchema.parse(value));
}

export async function addFirestoreTeamTask(teamId: string, task: TeamTask): Promise<TeamTask> {
  const db = getConfiguredFirestoreDb();
  const validatedTask = teamTaskSchema.parse(task);

  await setDoc(doc(db, "teams", teamId, "tasks", validatedTask.id), validatedTask);

  return validatedTask;
}

export const getFirestoreTeamMeetings = (teamId: string) =>
  getTeamSubcollection(teamId, "meetings", (value) => teamMeetingSchema.parse(value))();

export async function saveFirestoreTeamMeetings(
  teamId: string,
  meetings: TeamMeeting[]
): Promise<TeamMeeting[]> {
  return syncTeamSubcollection(teamId, "meetings", meetings, (value) =>
    teamMeetingSchema.parse(value)
  );
}

export async function addFirestoreTeamMeeting(
  teamId: string,
  meeting: TeamMeeting
): Promise<TeamMeeting> {
  const db = getConfiguredFirestoreDb();
  const validatedMeeting = teamMeetingSchema.parse(meeting);

  await setDoc(doc(db, "teams", teamId, "meetings", validatedMeeting.id), validatedMeeting);

  return validatedMeeting;
}

export const getFirestoreCopilotRuns = (teamId: string) =>
  getTeamSubcollection(teamId, "copilot_runs", (value) => teamCopilotRunSchema.parse(value))();

export async function saveFirestoreCopilotRuns(
  teamId: string,
  runs: TeamCopilotRun[]
): Promise<TeamCopilotRun[]> {
  return syncTeamSubcollection(teamId, "copilot_runs", runs, (value) =>
    teamCopilotRunSchema.parse(value)
  );
}

export async function addFirestoreCopilotRun(
  teamId: string,
  run: TeamCopilotRun
): Promise<TeamCopilotRun> {
  const db = getConfiguredFirestoreDb();
  const validatedRun = teamCopilotRunSchema.parse(run);

  await setDoc(doc(db, "teams", teamId, "copilot_runs", validatedRun.id), validatedRun);

  return validatedRun;
}

export async function getFirestoreBadgeBySubject(
  subjectType: BadgeCredential["subjectType"],
  subjectId: string
): Promise<BadgeCredential | null> {
  const db = getConfiguredFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, BADGES_COLLECTION),
      where("subjectType", "==", subjectType),
      where("subjectId", "==", subjectId)
    )
  );

  const firstDoc = snapshot.docs[0];

  if (!firstDoc) {
    return null;
  }

  return badgeCredentialSchema.parse({
    ...firstDoc.data(),
    id: firstDoc.id
  });
}

export async function saveFirestoreBadge(input: BadgeCredentialInput): Promise<BadgeCredential> {
  const db = getConfiguredFirestoreDb();
  const badge = badgeCredentialSchema.parse(input);

  await setDoc(doc(db, BADGES_COLLECTION, badge.id), badge);

  return badge;
}

export async function getFirestoreStateMeta(): Promise<DemoStateMetaInput | null> {
  const db = getConfiguredFirestoreDb();
  const metaDoc = await getDoc(doc(db, META_COLLECTION, DEMO_STATE_META_DOC));

  if (!metaDoc.exists()) {
    return null;
  }

  return demoStateMetaSchema.parse(metaDoc.data());
}

export async function saveFirestoreStateMeta(
  meta: DemoStateMetaInput
): Promise<DemoStateMetaInput> {
  const db = getConfiguredFirestoreDb();
  const parsedMeta = demoStateMetaSchema.parse(meta);

  await setDoc(doc(db, META_COLLECTION, DEMO_STATE_META_DOC), parsedMeta);

  return parsedMeta;
}
