import {
  DEFAULT_TEAM_SIZE,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  isMockDataEnabled
} from "@/lib/config";

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
  loadDemoSeed as loadMockDemoSeed,
  moveStudentBetweenTeams as moveMockStudentBetweenTeams,
  resolveTeamMoveRequest as resolveMockTeamMoveRequest
} from "@/lib/repo/mockRepository";
import {
  generateTeamsInputSchema,
  moveStudentInputSchema,
  moveStudentRequestSchema,
  questionnaireSubmissionSchema,
  rosterSetupInputSchema
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
  StudentQuestionnaire,
  StudentProfile,
  Team
} from "@/types/domain";

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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildStudentId(name: string, email: string) {
  const emailLocal = email.split("@")[0] ?? "";
  const base = slugify(`${name}-${emailLocal}`).slice(0, 24);
  return base ? `stu-${base}` : `stu-${Date.now()}`;
}

function buildRosterDefaults(name: string, email: string, section?: string, cohort?: string): StudentIntake {
  return {
    id: buildStudentId(name, email),
    name,
    email,
    timezone: "America/Phoenix",
    availability: [{ day: "Mon", start: "17:00", end: "19:00" }],
    strengths: ["collaboration", "reliability"],
    growthAreas: ["technical depth", "project planning"],
    preferredRole: "General contributor",
    communicationStyle: "collaborative",
    collaborationPreferences: ["shared docs", "weekly check-ins"],
    shortReflection: "Roster record created before student questionnaire completion.",
    roster: {
      section,
      cohort,
      rosterSource: "manual"
    }
  };
}

async function saveStudentRecord(student: StudentIntake) {
  if (isMockDataEnabled()) {
    return addMockStudentIntake(student);
  }

  return addFirestoreStudentIntake(student);
}

async function getStudentByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const students = await getStudents();

  return students.find((student) => student.email.trim().toLowerCase() === normalized) ?? null;
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

  const profiles = state.profiles.length ? state.profiles : await buildProfiles(state.students);
  const teams = generateTeamsDeterministic(profiles, fallbackTeamSize);

  const hydratedState: DemoState = {
    students: state.students,
    profiles,
    teams,
    updatedAt: new Date().toISOString()
  };

  firestoreState = {
    profiles: hydratedState.profiles,
    teams: hydratedState.teams,
    sourceSignature: buildSourceSignature(hydratedState.students),
    updatedAt: hydratedState.updatedAt
  };

  return hydratedState;
}

async function persistFirestoreTeams(
  students: StudentIntake[],
  profiles: StudentProfile[],
  teams: Team[]
) {
  const savedTeams = await saveFirestoreTeams(teams);
  const updatedAt = new Date().toISOString();

  firestoreState = {
    profiles,
    teams: savedTeams,
    sourceSignature: buildSourceSignature(students),
    updatedAt
  };

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

  return buildEmptyDemoState(students);
}

export async function addStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  if (isMockDataEnabled()) {
    return addMockStudentIntake(input);
  }

  const student = await addFirestoreStudentIntake(input);
  return student;
}

export async function createRosterStudent(input: {
  name: string;
  email: string;
  section?: string;
  cohort?: string;
}): Promise<StudentIntake> {
  const parsed = rosterSetupInputSchema.parse(input);
  const existing = await getStudentByEmail(parsed.email);

  const nextStudent: StudentIntake = existing
    ? {
        ...existing,
        name: parsed.name,
        email: parsed.email,
        roster: {
          ...existing.roster,
          section: parsed.section,
          cohort: parsed.cohort,
          rosterSource: existing.roster?.rosterSource ?? "manual"
        }
      }
    : buildRosterDefaults(parsed.name, parsed.email, parsed.section, parsed.cohort);

  return saveStudentRecord(nextStudent);
}

export async function submitStudentQuestionnaire(input: {
  name: string;
  email: string;
  timezone: string;
  availability: StudentIntake["availability"];
  strengths: string[];
  growthAreas: string[];
  preferredRole: string;
  communicationStyle: StudentIntake["communicationStyle"];
  collaborationPreferences: string[];
  shortReflection: string;
  questionnaire: StudentQuestionnaire;
}): Promise<StudentIntake> {
  const parsed = questionnaireSubmissionSchema.parse(input);
  const existing = await getStudentByEmail(parsed.email);

  const nextStudent: StudentIntake = {
    ...(existing ?? buildRosterDefaults(parsed.name, parsed.email)),
    name: parsed.name,
    email: parsed.email,
    timezone: parsed.timezone,
    availability: parsed.availability,
    strengths: parsed.strengths,
    growthAreas: parsed.growthAreas,
    preferredRole: parsed.preferredRole,
    communicationStyle: parsed.communicationStyle,
    collaborationPreferences: parsed.collaborationPreferences,
    shortReflection: parsed.shortReflection,
    questionnaire: {
      ...existing?.questionnaire,
      ...parsed.questionnaire,
      completedAt: parsed.questionnaire.completedAt ?? new Date().toISOString()
    }
  };

  return saveStudentRecord(nextStudent);
}

export async function generateProfilesForStudents(): Promise<StudentProfile[]> {
  if (isMockDataEnabled()) {
    return generateMockProfilesForStudents();
  }

  const students = await getFirestoreStudents();
  const profiles = await buildProfiles(students);
  const savedProfiles = await saveFirestoreProfiles(profiles);
  await clearFirestoreTeams();

  return structuredClone(savedProfiles);
}

export async function generateTeamsForProfiles(teamSize = 4): Promise<Team[]> {
  if (isMockDataEnabled()) {
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
  if (isMockDataEnabled()) {
    return getMockTeamById(teamId);
  }

  return getFirestoreTeamById(teamId);
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
  const teams = buildTeamsFromCandidates(moved);
  const savedTeams = await persistFirestoreTeams(state.students, state.profiles, teams);

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
    nextTeams = buildTeamsFromCandidates(applyInstructorSwap(toTeamCandidates(state.teams), parsed));
  }

  if (parsed.action === "swap_move") {
    if (!toTeam.members.some((member) => member.id === parsed.displacedStudentId)) {
      return {
        ok: false,
        error: "Selected swap candidate is not in the destination team."
      };
    }

    nextTeams = buildTeamsFromCandidates(
      applyPairwiseSwap(toTeamCandidates(state.teams), {
        fromTeamId: parsed.fromTeamId,
        toTeamId: parsed.toTeamId,
        incomingStudentId: parsed.studentId,
        displacedStudentId: parsed.displacedStudentId
      })
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

    nextTeams = buildTeamsFromCandidates(applyRerouteMove(toTeamCandidates(state.teams), parsed));
  }

  if (parsed.action === "force_override_move") {
    nextTeams = buildTeamsFromCandidates(applyInstructorSwap(toTeamCandidates(state.teams), parsed));
  }

  const savedTeams = await persistFirestoreTeams(state.students, state.profiles, nextTeams);

  return {
    ok: true,
    status: "moved",
    resolution: parsed.action,
    teams: structuredClone(savedTeams)
  };
}
