import fs from "node:fs/promises";
import path from "node:path";

import { seedStudents } from "@/data/seedStudents";
import { generateMockProfile } from "@/lib/ai/mock";
import { generateTeamsInputSchema, studentIntakeSchema } from "@/lib/schemas";
import { generateTeamsDeterministic } from "@/lib/teamFormation";
import type { DemoState, StudentIntake, StudentProfile, Team } from "@/types/domain";

const mockStatePath = path.join(process.cwd(), "data", "mockState.json");

let inMemoryState: DemoState | null = null;

function withTimestamp<T extends Omit<DemoState, "updatedAt">>(state: T): DemoState {
  return {
    ...state,
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

async function createSeedState(): Promise<DemoState> {
  const profiles = await buildProfiles(seedStudents);
  const teams = generateTeamsDeterministic(profiles, 4);

  return withTimestamp({
    students: [...seedStudents],
    profiles,
    teams
  });
}

async function persistState(state: DemoState) {
  try {
    await fs.writeFile(mockStatePath, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore persistence failures in hackathon mode; in-memory state still works.
  }
}

async function readPersistedState() {
  try {
    const raw = await fs.readFile(mockStatePath, "utf8");
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed.students)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function ensureState() {
  if (inMemoryState) return inMemoryState;

  const persisted = await readPersistedState();
  if (persisted) {
    inMemoryState = persisted;
    return inMemoryState;
  }

  inMemoryState = await createSeedState();
  await persistState(inMemoryState);
  return inMemoryState;
}

export async function getDemoState() {
  const state = await ensureState();
  return structuredClone(state);
}

export async function loadDemoSeed() {
  inMemoryState = await createSeedState();
  await persistState(inMemoryState);
  return structuredClone(inMemoryState);
}

export async function addStudentIntake(input: StudentIntake) {
  const parsed = studentIntakeSchema.parse(input);
  const state = await ensureState();

  const existingIndex = state.students.findIndex((student) => student.id === parsed.id);
  if (existingIndex >= 0) {
    state.students[existingIndex] = parsed;
  } else {
    state.students.push(parsed);
  }

  state.updatedAt = new Date().toISOString();
  await persistState(state);
  return structuredClone(parsed);
}

export async function generateProfilesForStudents() {
  const state = await ensureState();
  state.profiles = await buildProfiles(state.students);
  state.updatedAt = new Date().toISOString();
  await persistState(state);
  return structuredClone(state.profiles);
}

export async function generateTeamsForProfiles(teamSize = 4) {
  const parsed = generateTeamsInputSchema.parse({ teamSize });
  const state = await ensureState();

  if (!state.profiles.length) {
    state.profiles = await buildProfiles(state.students);
  }

  state.teams = generateTeamsDeterministic(state.profiles, parsed.teamSize);
  state.updatedAt = new Date().toISOString();
  await persistState(state);
  return structuredClone(state.teams);
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const state = await ensureState();
  return state.teams.find((team) => team.id === teamId) ?? null;
}
