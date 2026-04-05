import {
  DEFAULT_TEAM_SIZE,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  isMockDataEnabled
} from "@/lib/config";

import {
  generateProfilesForStudentsBatched,
  type ProfileGenerationResult
} from "@/lib/ai/profileGeneration";
import { normalizeDemoState } from "@/lib/demo-state";

import {
  addFirestoreStudentIntake,
  clearFirestoreTeams,
  getFirestoreStateMeta,
  getFirestoreProfiles,
  saveFirestoreTeam,
  getFirestoreStudents,
  getFirestoreTeamById,
  getFirestoreTeams,
  saveFirestoreProfiles,
  saveFirestoreStateMeta,
  saveFirestoreTeams,
  updateFirestoreStudentIntake
} from "@/lib/repo/firestoreRepository";
import { mergeTeamWorkspace, normalizeTeamWorkspace } from "@/lib/team-workspace";
import {
  addStudentIntake as addMockStudentIntake,
  generateProfilesForStudents as generateMockProfilesForStudents,
  generateTeamsForProfiles as generateMockTeamsForProfiles,
  getDemoState as getMockDemoState,
  getTeamById as getMockTeamById,
  loadDemoSeed as loadMockDemoSeed,
  moveStudentBetweenTeams as moveMockStudentBetweenTeams,
  resolveTeamMoveRequest as resolveMockTeamMoveRequest,
  saveTeam as saveMockTeam,
  updateStudentIntake as updateMockStudentIntake
} from "@/lib/repo/mockRepository";
import {
  generateTeamsInputSchema,
  moveStudentInputSchema,
  moveStudentRequestSchema
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
  Team
} from "@/types/domain";

function buildEmptyDemoState(students: StudentIntake[]): DemoState {
  const now = new Date().toISOString();

  return normalizeDemoState({
    students,
    profiles: [],
    teams: [],
    studentsUpdatedAt: now,
    profilesUpdatedAt: null,
    teamsUpdatedAt: null,
    updatedAt: now
  });
}

async function getFirestoreBackedState() {
  const [students, profiles, teams, meta] = await Promise.all([
    getFirestoreStudents(),
    getFirestoreProfiles(),
    getFirestoreTeams(),
    getFirestoreStateMeta()
  ]);

  return normalizeDemoState({
    students,
    profiles,
    teams,
    studentsUpdatedAt: meta?.studentsUpdatedAt,
    profilesUpdatedAt: meta?.profilesUpdatedAt,
    teamsUpdatedAt: meta?.teamsUpdatedAt
  });
}

async function ensureDerivedFirestoreState(
  state: DemoState,
  fallbackTeamSize = DEFAULT_TEAM_SIZE
) {
  if (state.teams.length) {
    return state;
  }

  if (!state.students.length) {
    return state;
  }

  const profiles = state.profiles.length
    ? state.profiles
    : (await generateProfilesForStudentsBatched(state.students)).profiles;
  const teams = generateTeamsDeterministic(profiles, fallbackTeamSize);
  const now = new Date().toISOString();
  const hydratedState = normalizeDemoState({
    students: state.students,
    profiles,
    teams: mergeTeamWorkspace(state.teams, teams),
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profiles.length ? state.profilesUpdatedAt : now,
    teamsUpdatedAt: now
  });
  await saveFirestoreStateMeta({
    studentsUpdatedAt: hydratedState.studentsUpdatedAt,
    profilesUpdatedAt: hydratedState.profilesUpdatedAt,
    teamsUpdatedAt: hydratedState.teamsUpdatedAt
  });

  return hydratedState;
}

async function persistFirestoreTeams(
  state: Pick<
    DemoState,
    "students" | "profiles" | "teams" | "studentsUpdatedAt" | "profilesUpdatedAt" | "teamsUpdatedAt"
  >
) {
  const savedTeams = await saveFirestoreTeams(state.teams);
  const nextState = normalizeDemoState({
    students: state.students,
    profiles: state.profiles,
    teams: savedTeams,
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: state.teamsUpdatedAt
  });
  await saveFirestoreStateMeta({
    studentsUpdatedAt: nextState.studentsUpdatedAt,
    profilesUpdatedAt: nextState.profilesUpdatedAt,
    teamsUpdatedAt: nextState.teamsUpdatedAt
  });

  return savedTeams;
}

export async function getStudents(): Promise<StudentIntake[]> {
  if (isMockDataEnabled()) {
    return (await getMockDemoState()).students;
  }

  return getFirestoreStudents();
}

export async function getDemoState(): Promise<DemoState> {
  if (isMockDataEnabled()) {
    return getMockDemoState();
  }

  return getFirestoreBackedState();
}

export async function loadDemoSeed(): Promise<DemoState> {
  if (isMockDataEnabled()) {
    return loadMockDemoSeed();
  }

  const students = await getFirestoreStudents();
  await Promise.all([saveFirestoreProfiles([]), clearFirestoreTeams()]);
  await saveFirestoreStateMeta({
    studentsUpdatedAt: new Date().toISOString(),
    profilesUpdatedAt: null,
    teamsUpdatedAt: null
  });

  return buildEmptyDemoState(students);
}

export async function addStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  if (isMockDataEnabled()) {
    return addMockStudentIntake(input);
  }

  const student = await addFirestoreStudentIntake(input);
  const state = await getFirestoreBackedState();
  await saveFirestoreStateMeta({
    studentsUpdatedAt: new Date().toISOString(),
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: state.teamsUpdatedAt
  });
  return student;
}

export async function updateStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  if (isMockDataEnabled()) {
    return updateMockStudentIntake(input);
  }

  const student = await updateFirestoreStudentIntake(input);
  const state = await getFirestoreBackedState();
  await saveFirestoreStateMeta({
    studentsUpdatedAt: new Date().toISOString(),
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: state.teamsUpdatedAt
  });

  return student;
}

export async function generateProfilesForStudents(): Promise<ProfileGenerationResult> {
  if (isMockDataEnabled()) {
    const profiles = await generateMockProfilesForStudents();
    return {
      profiles,
      summary: {
        providerUsed: "mock",
        geminiProfilesCount: 0,
        mockProfilesCount: profiles.length,
        rateLimited: false,
        warning: "Mock mode is enabled, so Gemini profile generation is bypassed."
      }
    };
  }

  const students = await getFirestoreStudents();
  const result = await generateProfilesForStudentsBatched(students);
  const savedProfiles = await saveFirestoreProfiles(result.profiles);
  const state = await getFirestoreBackedState();
  await saveFirestoreStateMeta({
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: new Date().toISOString(),
    teamsUpdatedAt: state.teamsUpdatedAt
  });

  return {
    profiles: structuredClone(savedProfiles),
    summary: result.summary
  };
}

export async function generateTeamsForProfiles(teamSize = 4): Promise<Team[]> {
  if (isMockDataEnabled()) {
    return generateMockTeamsForProfiles(teamSize);
  }

  const parsed = generateTeamsInputSchema.parse({ teamSize });
  let profiles = await getFirestoreProfiles();
  const state = await getFirestoreBackedState();
  let profilesUpdatedAt = state.profilesUpdatedAt;

  if (!profiles.length) {
    profiles = await saveFirestoreProfiles(
      (await generateProfilesForStudentsBatched(await getFirestoreStudents())).profiles
    );
    profilesUpdatedAt = new Date().toISOString();
  }

  const teams = generateTeamsDeterministic(profiles, parsed.teamSize);
  await clearFirestoreTeams();
  const savedTeams = await persistFirestoreTeams({
    students: state.students,
    profiles,
    teams: mergeTeamWorkspace(state.teams, teams),
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt,
    teamsUpdatedAt: new Date().toISOString()
  });

  return structuredClone(savedTeams);
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  if (isMockDataEnabled()) {
    return getMockTeamById(teamId);
  }

  const team = await getFirestoreTeamById(teamId);
  return team ? normalizeTeamWorkspace(team) : null;
}

export async function saveTeam(team: Team): Promise<Team> {
  if (isMockDataEnabled()) {
    return saveMockTeam(team);
  }

  const saved = await saveFirestoreTeam(normalizeTeamWorkspace(team));
  const state = await getFirestoreBackedState();
  await saveFirestoreStateMeta({
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: new Date().toISOString()
  });

  return structuredClone(saved);
}

export async function moveStudentBetweenTeams(input: {
  studentId: string;
  fromTeamId: string;
  toTeamId: string;
}): Promise<Team[]> {
  if (isMockDataEnabled()) {
    return moveMockStudentBetweenTeams(input);
  }

  const parsed = moveStudentInputSchema.parse(input);
  const baseState = await getFirestoreBackedState();
  const state = await ensureDerivedFirestoreState(baseState);

  if (!state.teams.length) {
    throw new Error("No teams exist yet. Generate teams before moving students.");
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
  const teams = mergeTeamWorkspace(state.teams, buildTeamsFromCandidates(moved));
  const savedTeams = await persistFirestoreTeams({
    students: state.students,
    profiles: state.profiles,
    teams,
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: new Date().toISOString()
  });

  return structuredClone(savedTeams);
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
  if (isMockDataEnabled()) {
    return resolveMockTeamMoveRequest(input);
  }

  const parsed = moveStudentRequestSchema.parse(input);
  const baseState = await getFirestoreBackedState();
  const state = await ensureDerivedFirestoreState(baseState);

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

  let nextTeams = state.teams;

  if (parsed.action === "simple_move") {
    nextTeams = mergeTeamWorkspace(
      state.teams,
      buildTeamsFromCandidates(applyInstructorSwap(toTeamCandidates(state.teams), parsed))
    );
  }

  if (parsed.action === "swap_move") {
    if (!toTeam.members.some((member) => member.id === parsed.displacedStudentId)) {
      return {
        ok: false,
        error: "Selected swap candidate is not in the destination team."
      };
    }

    nextTeams = mergeTeamWorkspace(
      state.teams,
      buildTeamsFromCandidates(
        applyPairwiseSwap(toTeamCandidates(state.teams), {
          fromTeamId: parsed.fromTeamId,
          toTeamId: parsed.toTeamId,
          incomingStudentId: parsed.studentId,
          displacedStudentId: parsed.displacedStudentId
        })
      )
    );
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

    nextTeams = mergeTeamWorkspace(
      state.teams,
      buildTeamsFromCandidates(applyRerouteMove(toTeamCandidates(state.teams), parsed))
    );
  }

  if (parsed.action === "force_override_move") {
    nextTeams = mergeTeamWorkspace(
      state.teams,
      buildTeamsFromCandidates(applyInstructorSwap(toTeamCandidates(state.teams), parsed))
    );
  }

  const savedTeams = await persistFirestoreTeams({
    students: state.students,
    profiles: state.profiles,
    teams: nextTeams,
    studentsUpdatedAt: state.studentsUpdatedAt,
    profilesUpdatedAt: state.profilesUpdatedAt,
    teamsUpdatedAt: new Date().toISOString()
  });

  return {
    ok: true,
    status: "moved",
    resolution: parsed.action,
    teams: structuredClone(savedTeams)
  };
}
