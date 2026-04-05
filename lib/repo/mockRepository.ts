import fs from "node:fs/promises";
import path from "node:path";

import { seedStudents } from "@/data/seedStudents";
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "@/lib/config";
import { normalizeDemoState } from "@/lib/demo-state";
import { generateMockProfile } from "@/lib/ai/mock";
import {
  generateTeamsInputSchema,
  moveStudentInputSchema,
  moveStudentRequestSchema,
  studentIntakeSchema
} from "@/lib/schemas";
import {
  applyInstructorSwap,
  applyPairwiseSwap,
  applyRerouteMove,
  buildTeamsFromCandidates,
  generateTeamsDeterministic
} from "@/lib/teamFormation";
import {
  getLegalRerouteTargets,
  getTopSwapSuggestions
} from "@/lib/teamFormation";
import type {
  DemoState,
  DestinationFullResolution,
  MoveStudentRequest,
  MoveStudentResponse,
  StudentIntake,
  StudentProfile,
  Team
} from "@/types/domain";

const mockStatePath = path.join(process.cwd(), "data", "mockState.json");

let inMemoryState: DemoState | null = null;

/**
 * Rebuilds the state after a mutation so freshness flags stay consistent.
 * This keeps profiles/teams visible after roster edits but marks them stale.
 */
function rehydrateState(
  current: Pick<DemoState, "students" | "profiles" | "teams"> &
    Partial<Pick<DemoState, "studentsUpdatedAt" | "profilesUpdatedAt" | "teamsUpdatedAt" | "updatedAt">>
) {
  return normalizeDemoState(current);
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
  const now = new Date().toISOString();

  return rehydrateState({
    students: [...seedStudents],
    profiles,
    teams,
    studentsUpdatedAt: now,
    profilesUpdatedAt: now,
    teamsUpdatedAt: now,
    updatedAt: now
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
    return rehydrateState(parsed);
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
  const now = new Date().toISOString();

  const existingIndex = state.students.findIndex((student) => student.id === parsed.id);
  if (existingIndex >= 0) {
    state.students[existingIndex] = parsed;
  } else {
    state.students.push(parsed);
  }

  inMemoryState = rehydrateState({
    students: state.students,
    profiles: state.profiles,
    teams: state.teams,
    studentsUpdatedAt: now,
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: state.teamsUpdatedAt
  });
  await persistState(inMemoryState);
  return structuredClone(parsed);
}

export async function updateStudentIntake(input: StudentIntake) {
  const parsed = studentIntakeSchema.parse(input);
  const state = await ensureState();
  const existingIndex = state.students.findIndex((student) => student.id === parsed.id);

  if (existingIndex < 0) {
    throw new Error("Student record was not found.");
  }

  state.students[existingIndex] = parsed;

  inMemoryState = rehydrateState({
    students: state.students,
    profiles: state.profiles,
    teams: state.teams,
    studentsUpdatedAt: new Date().toISOString(),
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: state.teamsUpdatedAt
  });
  await persistState(inMemoryState);
  return structuredClone(parsed);
}

export async function generateProfilesForStudents() {
  const state = await ensureState();
  const profiles = await buildProfiles(state.students);

  inMemoryState = rehydrateState({
    students: state.students,
    profiles,
    teams: state.teams,
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: new Date().toISOString(),
    teamsUpdatedAt: state.teamsUpdatedAt
  });
  await persistState(inMemoryState);
  return structuredClone(inMemoryState.profiles);
}

export async function generateTeamsForProfiles(teamSize = 4) {
  const parsed = generateTeamsInputSchema.parse({ teamSize });
  const state = await ensureState();
  let profiles = state.profiles;

  if (!profiles.length) {
    profiles = await buildProfiles(state.students);
  }

  const now = new Date().toISOString();
  const teams = generateTeamsDeterministic(profiles, parsed.teamSize);

  inMemoryState = rehydrateState({
    students: state.students,
    profiles,
    teams,
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profiles.length ? state.profilesUpdatedAt : now,
    teamsUpdatedAt: now
  });
  await persistState(inMemoryState);
  return structuredClone(inMemoryState.teams);
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const state = await ensureState();
  return state.teams.find((team) => team.id === teamId) ?? null;
}

export async function moveStudentBetweenTeams(input: {
  studentId: string;
  fromTeamId: string;
  toTeamId: string;
}) {
  const parsed = moveStudentInputSchema.parse(input);
  const state = await ensureState();

  if (!state.teams.length) {
    throw new Error("No teams exist yet. Generate teams before moving students.");
  }

  if (parsed.fromTeamId === parsed.toTeamId) {
    throw new Error("Choose a different destination team.");
  }

  const fromTeam = state.teams.find((team) => team.id === parsed.fromTeamId);
  const toTeam = state.teams.find((team) => team.id === parsed.toTeamId);

  if (!fromTeam || !toTeam) {
    throw new Error("Selected team was not found.");
  }

  if (!fromTeam.members.some((member) => member.id === parsed.studentId)) {
    throw new Error("Selected student is not in the source team.");
  }

  if (fromTeam.members.length - 1 < MIN_TEAM_SIZE) {
    throw new Error(`A team cannot drop below ${MIN_TEAM_SIZE} students.`);
  }

  if (toTeam.members.length + 1 > MAX_TEAM_SIZE) {
    throw new Error(`A team cannot exceed ${MAX_TEAM_SIZE} students.`);
  }

  const candidates = state.teams.map((team) => ({
    id: team.id,
    members: [...team.members]
  }));
  const moved = applyInstructorSwap(candidates, parsed);
  inMemoryState = rehydrateState({
    students: state.students,
    profiles: state.profiles,
    teams: buildTeamsFromCandidates(moved),
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: new Date().toISOString()
  });
  await persistState(inMemoryState);
  return structuredClone(inMemoryState.teams);
}

function toTeamCandidates(teams: Team[]) {
  return teams.map((team) => ({
    id: team.id,
    members: [...team.members]
  }));
}

function buildDestinationFullResolution(
  teams: Team[],
  params: {
    studentId: string;
    fromTeamId: string;
    toTeamId: string;
  }
): DestinationFullResolution {
  const candidates = toTeamCandidates(teams);
  const destinationTeam = teams.find((team) => team.id === params.toTeamId);

  return {
    destinationTeamId: params.toTeamId,
    destinationTeamName: params.toTeamId,
    currentSize: destinationTeam?.members.length ?? 0,
    maxSize: MAX_TEAM_SIZE,
    suggestedSwaps: getTopSwapSuggestions(candidates, params).map((suggestion) => ({
      displacedStudentId: suggestion.displacedStudentId,
      displacedStudentName: suggestion.displacedStudentName,
      displacedStudentRole: suggestion.displacedStudentRole,
      sourceTeamScoreDelta: suggestion.sourceTeamScoreDelta,
      destinationTeamScoreDelta: suggestion.destinationTeamScoreDelta,
      fairnessDelta: suggestion.fairnessDelta,
      legal: suggestion.legal
    })),
    destinationMembers:
      destinationTeam?.members.map((member) => ({
        studentId: member.id,
        studentName: member.name,
        preferredRole: member.preferredRole
      })) ?? [],
    rerouteTargets: getLegalRerouteTargets(candidates, params)
  };
}

export async function resolveTeamMoveRequest(
  input: MoveStudentRequest
): Promise<MoveStudentResponse> {
  const parsed = moveStudentRequestSchema.parse(input);
  const state = await ensureState();

  if (!state.teams.length) {
    return {
      ok: false,
      error: "No teams exist yet. Generate teams before moving students."
    };
  }

  const fromTeam = state.teams.find((team) => team.id === parsed.fromTeamId);
  const toTeam = state.teams.find((team) => team.id === parsed.toTeamId);

  if (!fromTeam || !toTeam) {
    return {
      ok: false,
      error: "Selected team was not found."
    };
  }

  if (!fromTeam.members.some((member) => member.id === parsed.studentId)) {
    return {
      ok: false,
      error: "Selected student is not in the source team."
    };
  }

  if (parsed.fromTeamId === parsed.toTeamId) {
    return {
      ok: false,
      error: "Choose a different destination team."
    };
  }

  if (parsed.action !== "swap_move" && fromTeam.members.length - 1 < MIN_TEAM_SIZE) {
    return {
      ok: false,
      error: `A team cannot drop below ${MIN_TEAM_SIZE} students.`
    };
  }

  const destinationIsFull = toTeam.members.length >= MAX_TEAM_SIZE;

  if (parsed.action === "analyze_move" || (parsed.action === "simple_move" && destinationIsFull)) {
    return {
      ok: true,
      status: "destination_full",
      resolution: buildDestinationFullResolution(state.teams, parsed)
    };
  }

  if (parsed.action === "simple_move") {
    const moved = applyInstructorSwap(toTeamCandidates(state.teams), parsed);
    state.teams = buildTeamsFromCandidates(moved);
  }

  if (parsed.action === "swap_move") {
    if (!toTeam.members.some((member) => member.id === parsed.displacedStudentId)) {
      return {
        ok: false,
        error: "Selected swap candidate is not in the destination team."
      };
    }

    const swapped = applyPairwiseSwap(toTeamCandidates(state.teams), {
      fromTeamId: parsed.fromTeamId,
      toTeamId: parsed.toTeamId,
      incomingStudentId: parsed.studentId,
      displacedStudentId: parsed.displacedStudentId
    });
    state.teams = buildTeamsFromCandidates(swapped);
  }

  if (parsed.action === "reroute_move") {
    if (!toTeam.members.some((member) => member.id === parsed.displacedStudentId)) {
      return {
        ok: false,
        error: "Selected displaced student is not in the destination team."
      };
    }

    const rerouteTeam = state.teams.find((team) => team.id === parsed.rerouteTeamId);
    if (!rerouteTeam) {
      return {
        ok: false,
        error: "Selected reroute team was not found."
      };
    }

    const rerouteCount =
      parsed.rerouteTeamId === parsed.fromTeamId ? fromTeam.members.length - 1 : rerouteTeam.members.length;
    if (rerouteCount + 1 > MAX_TEAM_SIZE) {
      return {
        ok: false,
        error: `The reroute team would exceed ${MAX_TEAM_SIZE} students.`
      };
    }

    const rerouted = applyRerouteMove(toTeamCandidates(state.teams), parsed);
    state.teams = buildTeamsFromCandidates(rerouted);
  }

  if (parsed.action === "force_override_move") {
    const moved = applyInstructorSwap(toTeamCandidates(state.teams), parsed);
    state.teams = buildTeamsFromCandidates(moved);
  }

  inMemoryState = rehydrateState({
    students: state.students,
    profiles: state.profiles,
    teams: state.teams,
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: new Date().toISOString()
  });
  await persistState(inMemoryState);

  return {
    ok: true,
    status: "moved",
    resolution: parsed.action,
    teams: structuredClone(inMemoryState.teams)
  };
}
