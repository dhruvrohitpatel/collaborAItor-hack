import { useMockData } from "@/lib/config";
import { generateProfileForStudent } from "@/lib/ai/profileGeneration";
import {
  addFirestoreStudentIntake,
  clearFirestoreTeams,
  getFirestoreProfiles,
  getFirestoreStudents,
  getFirestoreTeamById,
  getFirestoreTeams,
  saveFirestoreProfiles,
  saveFirestoreTeams
} from "@/lib/repo/firestoreRepository";
import {
  addStudentIntake as addMockStudentIntake,
  generateProfilesForStudents as generateMockProfilesForStudents,
  generateTeamsForProfiles as generateMockTeamsForProfiles,
  getDemoState as getMockDemoState,
  getTeamById as getMockTeamById,
  loadDemoSeed as loadMockDemoSeed
} from "@/lib/repo/mockRepository";
import { generateTeamsInputSchema } from "@/lib/schemas";
import { generateTeamsDeterministic } from "@/lib/teamFormation";
import type { DemoState, StudentIntake, StudentProfile, Team } from "@/types/domain";

function buildEmptyDemoState(students: StudentIntake[]): DemoState {
  return {
    students,
    profiles: [],
    teams: [],
    updatedAt: new Date().toISOString()
  };
}

async function buildProfiles(students: StudentIntake[]): Promise<StudentProfile[]> {
  const profiles: StudentProfile[] = [];

  for (const student of students) {
    profiles.push(await generateProfileForStudent(student));
  }

  return profiles;
}

async function getFirestoreBackedState() {
  const [students, profiles, teams] = await Promise.all([
    getFirestoreStudents(),
    getFirestoreProfiles(),
    getFirestoreTeams()
  ]);
  const timestamps = [
    ...profiles.map((profile) => profile.profileGeneratedAt),
    ...teams.flatMap((team) => team.members.map((member) => member.profileGeneratedAt))
  ].sort();

  return {
    students,
    profiles,
    teams,
    updatedAt: timestamps.at(-1) ?? new Date().toISOString()
  } satisfies DemoState;
}

export async function getStudents(): Promise<StudentIntake[]> {
  if (useMockData()) {
    return (await getMockDemoState()).students;
  }

  return getFirestoreStudents();
}

export async function getDemoState(): Promise<DemoState> {
  if (useMockData()) {
    return getMockDemoState();
  }

  return getFirestoreBackedState();
}

export async function loadDemoSeed(): Promise<DemoState> {
  if (useMockData()) {
    return loadMockDemoSeed();
  }

  const students = await getFirestoreStudents();
  await Promise.all([saveFirestoreProfiles([]), clearFirestoreTeams()]);

  return buildEmptyDemoState(students);
}

export async function addStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  if (useMockData()) {
    return addMockStudentIntake(input);
  }

  const student = await addFirestoreStudentIntake(input);
  return student;
}

export async function generateProfilesForStudents(): Promise<StudentProfile[]> {
  if (useMockData()) {
    return generateMockProfilesForStudents();
  }

  const students = await getFirestoreStudents();
  const profiles = await buildProfiles(students);
  const savedProfiles = await saveFirestoreProfiles(profiles);
  await clearFirestoreTeams();

  return structuredClone(savedProfiles);
}

export async function generateTeamsForProfiles(teamSize = 4): Promise<Team[]> {
  if (useMockData()) {
    return generateMockTeamsForProfiles(teamSize);
  }

  const parsed = generateTeamsInputSchema.parse({ teamSize });
  let profiles = await getFirestoreProfiles();

  if (!profiles.length) {
    profiles = await saveFirestoreProfiles(await buildProfiles(await getFirestoreStudents()));
  }

  const teams = generateTeamsDeterministic(profiles, parsed.teamSize);
  await clearFirestoreTeams();
  const savedTeams = await saveFirestoreTeams(teams);

  return structuredClone(savedTeams);
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  if (useMockData()) {
    return getMockTeamById(teamId);
  }

  return getFirestoreTeamById(teamId);
}
