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
import {
  collaborationProfileSchema,
  demoStateMetaSchema,
  googleConnectionSchema,
  studentIntakeSchema,
  teamSchema
} from "@/lib/schemas";
import type { StudentIntake, StudentProfile, Team } from "@/types/domain";
import type { DemoStateMetaInput, GoogleConnectionInput } from "@/lib/schemas";

const META_COLLECTION = "meta";
const DEMO_STATE_META_DOC = "demo-state";
const GOOGLE_CONNECTIONS_COLLECTION = "googleConnections";

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

export async function saveFirestoreTeam(team: Team): Promise<Team> {
  const db = getConfiguredFirestoreDb();
  const validatedTeam = teamSchema.parse(team);

  await setDoc(doc(db, "teams", validatedTeam.id), validatedTeam);

  return validatedTeam;
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

export async function getFirestoreGoogleConnectionById(
  id: string
): Promise<GoogleConnectionInput | null> {
  const db = getConfiguredFirestoreDb();
  const connectionDoc = await getDoc(doc(db, GOOGLE_CONNECTIONS_COLLECTION, id));

  if (!connectionDoc.exists()) {
    return null;
  }

  return googleConnectionSchema.parse({
    ...connectionDoc.data(),
    id: connectionDoc.id
  });
}

export async function getFirestoreGoogleConnectionByEmail(
  email: string
): Promise<GoogleConnectionInput | null> {
  const db = getConfiguredFirestoreDb();
  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = await getDocs(
    query(collection(db, GOOGLE_CONNECTIONS_COLLECTION), where("email", "==", normalizedEmail))
  );

  const record = snapshot.docs.at(0);
  if (!record) {
    return null;
  }

  return googleConnectionSchema.parse({
    ...record.data(),
    id: record.id
  });
}

export async function listFirestoreGoogleConnectionsByEmails(
  emails: string[]
): Promise<GoogleConnectionInput[]> {
  const db = getConfiguredFirestoreDb();
  const normalized = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];

  if (!normalized.length) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, GOOGLE_CONNECTIONS_COLLECTION), where("email", "in", normalized))
  );

  return snapshot.docs.map((record) =>
    googleConnectionSchema.parse({
      ...record.data(),
      id: record.id
    })
  );
}

export async function saveFirestoreGoogleConnection(
  connection: GoogleConnectionInput
): Promise<GoogleConnectionInput> {
  const db = getConfiguredFirestoreDb();
  const parsed = googleConnectionSchema.parse(connection);

  await setDoc(doc(db, GOOGLE_CONNECTIONS_COLLECTION, parsed.id), parsed);

  return parsed;
}
