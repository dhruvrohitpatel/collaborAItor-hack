import { useMockData } from "@/lib/config";
import { generateMockProfile } from "@/lib/ai/mock";
import {
  addFirestoreStudentIntake,
  getFirestoreStudents
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

type DerivedFirestoreState = {
  profiles: StudentProfile[];
  teams: Team[];
  sourceSignature: string;
  updatedAt: string;
};

let firestoreState: DerivedFirestoreState | null = null;

function buildSourceSignature(students: StudentIntake[]) {
  return students.map((student) => student.id).sort().join("|");
}

function buildEmptyDemoState(students: StudentIntake[]): DemoState {
  return {
    students,
    profiles: [],
    teams: [],
    updatedAt: new Date().toISOString()
  };
}

async function buildProfiles(students: StudentIntake[]): Promise<StudentProfile[]> {
  return Promise.all(
    students.map(async (student) => {
      const profile = await generateMockProfile(student);
      return {
        ...student,
        ...profile,
        profileGeneratedAt: new Date().toISOString()
      };
    })
  );
}

async function getFirestoreBackedState() {
  const students = await getFirestoreStudents();
  const sourceSignature = buildSourceSignature(students);

  if (!firestoreState || firestoreState.sourceSignature !== sourceSignature) {
    firestoreState = {
      profiles: [],
      teams: [],
      sourceSignature,
      updatedAt: new Date().toISOString()
    };
  }

  return {
    students,
    profiles: firestoreState.profiles,
    teams: firestoreState.teams,
    updatedAt: firestoreState.updatedAt
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
  firestoreState = {
    profiles: [],
    teams: [],
    sourceSignature: buildSourceSignature(students),
    updatedAt: new Date().toISOString()
  };

  return buildEmptyDemoState(students);
}

export async function addStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  if (useMockData()) {
    return addMockStudentIntake(input);
  }

  const student = await addFirestoreStudentIntake(input);
  firestoreState = null;
  return student;
}

export async function generateProfilesForStudents(): Promise<StudentProfile[]> {
  if (useMockData()) {
    return generateMockProfilesForStudents();
  }

  const students = await getFirestoreStudents();
  const profiles = await buildProfiles(students);

  firestoreState = {
    profiles,
    teams: [],
    sourceSignature: buildSourceSignature(students),
    updatedAt: new Date().toISOString()
  };

  return structuredClone(profiles);
}

export async function generateTeamsForProfiles(teamSize = 4): Promise<Team[]> {
  if (useMockData()) {
    return generateMockTeamsForProfiles(teamSize);
  }

  const parsed = generateTeamsInputSchema.parse({ teamSize });
  const students = await getFirestoreStudents();
  const sourceSignature = buildSourceSignature(students);
  const profiles =
    firestoreState?.sourceSignature === sourceSignature && firestoreState.profiles.length
      ? firestoreState.profiles
      : await buildProfiles(students);
  const teams = generateTeamsDeterministic(profiles, parsed.teamSize);

  firestoreState = {
    profiles,
    teams,
    sourceSignature,
    updatedAt: new Date().toISOString()
  };

  return structuredClone(teams);
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  if (useMockData()) {
    return getMockTeamById(teamId);
  }

  const state = await getFirestoreBackedState();
  return state.teams.find((team) => team.id === teamId) ?? null;
}
