import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "@/lib/config";
import { clampScore } from "@/lib/utils";
import type {
  MoveTargetOption,
  RiskFlag,
  StudentProfile,
  SuggestedSwapOption,
  Team,
  TeamScoreBreakdown
} from "@/types/domain";

/**
 * Central scoring weights for team quality dimensions.
 * Tune these first when you want to change behavior.
 */
export const SCORING_WEIGHTS = {
  skillCoverage: 0.24,
  availabilityOverlap: 0.2,
  communicationBalance: 0.16,
  leadershipBalance: 0.16,
  growthFit: 0.24
} as const;

/**
 * Operational thresholds and penalties used by risk/fairness checks.
 * Tune these to make the engine stricter or more lenient.
 */
export const SCORING_TUNABLES = {
  lowAvailabilityThreshold: 35,
  lowCommunicationThreshold: 45,
  lowSkillCoverageThreshold: 40,
  lowGrowthFitThreshold: 30,
  lowRiskConcentrationThreshold: 45,
  riskPenaltyHigh: 18,
  riskPenaltyMedium: 10,
  riskPenaltyLow: 5,
  riskPenaltyMultiplier: 0.6,
  repairIterations: 2
} as const;

export type TeamCandidate = {
  id: string;
  members: StudentProfile[];
};

type TeamScoredCandidate = TeamCandidate & {
  scoreSummary: TeamScoreBreakdown;
  riskFlags: RiskFlag[];
};

export type RosterFairnessSummary = {
  scoreSpread: number;
  leadershipSpread: number;
  communicationSpread: number;
  highRiskSpread: number;
  overall: number;
  concentratedRiskTeamIds: string[];
};

export type ScoredRoster = {
  teams: TeamScoredCandidate[];
  fairness: RosterFairnessSummary;
};

export type SwapProposal = {
  fromTeamId: string;
  toTeamId: string;
  fromStudentId: string;
  toStudentId: string;
  beforeMinScore: number;
  afterMinScore: number;
  beforeFairness: number;
  afterFairness: number;
};

type RankedSwapOption = SuggestedSwapOption & {
  projectedCandidates: TeamCandidate[];
  objectiveGain: number;
};

function normalize(value: number, max: number) {
  if (max <= 0) return 0;
  return clampScore((value / max) * 100);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function availabilityToSet(profile: StudentProfile) {
  return new Set(
    profile.availability.map((slot) => `${slot.day}-${slot.start}-${slot.end}`)
  );
}

/**
 * Scores how much members can realistically meet at overlapping times.
 * Higher means easier team coordination.
 */
export function scoreAvailabilityOverlap(members: StudentProfile[]) {
  if (members.length < 2) return 100;

  let comparisons = 0;
  let overlapTotal = 0;

  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = availabilityToSet(members[i]);
      const b = availabilityToSet(members[j]);
      const intersection = [...a].filter((entry) => b.has(entry)).length;
      const union = new Set([...a, ...b]).size;
      overlapTotal += union ? intersection / union : 0;
      comparisons += 1;
    }
  }

  return clampScore((overlapTotal / comparisons) * 100);
}

/**
 * Scores breadth of unique strengths represented on the team.
 * Higher means broader skill coverage for delivery.
 */
export function scoreSkillCoverage(members: StudentProfile[]) {
  const uniqueStrengths = new Set(
    members.flatMap((member) => member.strengths.map(normalizeToken))
  );

  // Approximate expected strength variety for typical 4-person teams.
  const expectedCoverage = members.length * 2;
  return normalize(uniqueStrengths.size, expectedCoverage);
}

/**
 * Scores communication-style diversity while penalizing one-style dominance.
 * Higher means healthier collaboration dynamics.
 */
export function scoreCommunicationBalance(members: StudentProfile[]) {
  const styleCounts = new Map<string, number>();

  members.forEach((member) => {
    styleCounts.set(
      member.communicationStyle,
      (styleCounts.get(member.communicationStyle) || 0) + 1
    );
  });

  const uniqueStyles = styleCounts.size;
  const maxStyleCount = Math.max(...styleCounts.values());
  const diversity = normalize(uniqueStyles, Math.min(4, members.length));
  const dominancePenalty =
    clampScore((maxStyleCount / members.length) * 100) - 25;

  return clampScore(diversity - dominancePenalty * 0.5);
}

/**
 * Scores leadership distribution so each team has facilitation capacity.
 * Highest score is exactly one strong leadership signal per team.
 */
export function scoreLeadershipBalance(members: StudentProfile[]) {
  const high = members.filter(
    (member) => member.leadershipSignal === "high"
  ).length;
  const medium = members.filter(
    (member) => member.leadershipSignal === "medium"
  ).length;

  if (high === 1) return 100;
  if (high === 0 && medium >= 2) return 75;
  if (high >= 2) return 65;
  return 55;
}

/**
 * Scores whether team strengths can support teammates' growth areas.
 * Higher means stronger peer-learning potential.
 */
export function scoreGrowthFit(members: StudentProfile[]) {
  const allStrengths = new Set(
    members.flatMap((member) => member.strengths.map(normalizeToken))
  );
  const allGrowthTargets = members.flatMap((member) =>
    member.growthAreas.map(normalizeToken)
  );

  const matches = allGrowthTargets.filter((target) =>
    allStrengths.has(target)
  ).length;
  return normalize(matches, allGrowthTargets.length || 1);
}

/**
 * Scores role concentration risk (higher is better / less concentrated).
 * Used to detect teams where responsibility is too narrowly clustered.
 */
export function scoreRiskConcentration(members: StudentProfile[]) {
  const roleCounts = new Map<string, number>();

  members.forEach((member) => {
    const roleToken = normalizeToken(member.preferredRole);
    roleCounts.set(roleToken, (roleCounts.get(roleToken) || 0) + 1);
  });

  const uniqueRoles = roleCounts.size;
  const maxRoleCount = Math.max(...roleCounts.values());
  const diversity = normalize(uniqueRoles, Math.min(3, members.length));
  const concentrationPenalty =
    clampScore((maxRoleCount / members.length) * 100) - 35;

  return clampScore(diversity - concentrationPenalty * 0.8);
}

function deriveRiskFlags(
  members: StudentProfile[],
  components: Omit<TeamScoreBreakdown, "total" | "riskPenalty">
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (members.length > MAX_TEAM_SIZE) {
    flags.push({
      code: "team_size_over_max",
      label: "Team size exceeds max",
      severity: "high",
      note: `Instructor override placed ${members.length} students on this team. Rebalance to return within the ${MIN_TEAM_SIZE}-${MAX_TEAM_SIZE} range.`
    });
  }

  if (members.length < MIN_TEAM_SIZE) {
    flags.push({
      code: "team_size_under_min",
      label: "Team size below minimum",
      severity: "high",
      note: `This team has ${members.length} students and should be repaired to reach at least ${MIN_TEAM_SIZE}.`
    });
  }

  if (
    components.availabilityOverlap < SCORING_TUNABLES.lowAvailabilityThreshold
  ) {
    flags.push({
      code: "availability_low",
      label: "Low schedule overlap",
      severity: "high",
      note: "Limited shared collaboration windows may slow coordination."
    });
  }

  if (
    components.communicationBalance < SCORING_TUNABLES.lowCommunicationThreshold
  ) {
    flags.push({
      code: "communication_monoculture",
      label: "Communication style concentration",
      severity: "medium",
      note: "Style diversity is limited; consider explicit communication norms."
    });
  }

  const highLeaders = members.filter(
    (member) => member.leadershipSignal === "high"
  ).length;
  if (highLeaders === 0) {
    flags.push({
      code: "leadership_gap",
      label: "Leadership coverage gap",
      severity: "medium",
      note: "No strong facilitator signal detected; monitor kickoff execution."
    });
  }

  if (components.skillDiversity < SCORING_TUNABLES.lowSkillCoverageThreshold) {
    flags.push({
      code: "skill_overlap",
      label: "Skill concentration",
      severity: "low",
      note: "Strength coverage is narrow; assign explicit cross-functional checkpoints."
    });
  }

  if (
    components.growthOpportunityFit < SCORING_TUNABLES.lowGrowthFitThreshold
  ) {
    flags.push({
      code: "growth_support_low",
      label: "Limited growth support fit",
      severity: "low",
      note: "Current strengths weakly align with stated growth goals."
    });
  }

  if (
    scoreRiskConcentration(members) <
    SCORING_TUNABLES.lowRiskConcentrationThreshold
  ) {
    flags.push({
      code: "role_concentration",
      label: "Role concentration risk",
      severity: "medium",
      note: "Preferred roles are clustered; encourage role rotation from week one."
    });
  }

  return flags;
}

function riskPenaltyFromFlags(flags: RiskFlag[]) {
  return flags.reduce((total, flag) => {
    if (flag.severity === "high")
      return total + SCORING_TUNABLES.riskPenaltyHigh;
    if (flag.severity === "medium")
      return total + SCORING_TUNABLES.riskPenaltyMedium;
    return total + SCORING_TUNABLES.riskPenaltyLow;
  }, 0);
}

/**
 * Scores one team and returns both numeric breakdown and explanatory risk flags.
 * This is the primary function to debug/tune single-team quality.
 */
export function scoreTeam(members: StudentProfile[]): {
  scoreSummary: TeamScoreBreakdown;
  riskFlags: RiskFlag[];
} {
  const components = {
    skillDiversity: scoreSkillCoverage(members),
    availabilityOverlap: scoreAvailabilityOverlap(members),
    communicationBalance: scoreCommunicationBalance(members),
    leadershipDistribution: scoreLeadershipBalance(members),
    growthOpportunityFit: scoreGrowthFit(members)
  };

  const riskFlags = deriveRiskFlags(members, components);
  const riskPenalty = riskPenaltyFromFlags(riskFlags);

  const weightedScore =
    components.skillDiversity * SCORING_WEIGHTS.skillCoverage +
    components.availabilityOverlap * SCORING_WEIGHTS.availabilityOverlap +
    components.communicationBalance * SCORING_WEIGHTS.communicationBalance +
    components.leadershipDistribution * SCORING_WEIGHTS.leadershipBalance +
    components.growthOpportunityFit * SCORING_WEIGHTS.growthFit;

  const total = clampScore(
    weightedScore - riskPenalty * SCORING_TUNABLES.riskPenaltyMultiplier
  );

  return {
    scoreSummary: {
      ...components,
      riskPenalty,
      total
    },
    riskFlags
  };
}

/**
 * Scores all teams together and adds roster-level fairness checks.
 * Use this to compare whole-roster quality after swaps/repairs.
 */
export function scoreTeamsAcrossRoster(
  candidates: TeamCandidate[]
): ScoredRoster {
  const teams = candidates.map((candidate) => {
    const scored = scoreTeam(candidate.members);
    return {
      ...candidate,
      scoreSummary: scored.scoreSummary,
      riskFlags: scored.riskFlags
    };
  });

  const totalScores = teams.map((team) => team.scoreSummary.total);
  const highLeaderCounts = teams.map(
    (team) =>
      team.members.filter((member) => member.leadershipSignal === "high").length
  );
  const communicationDiversity = teams.map(
    (team) =>
      new Set(team.members.map((member) => member.communicationStyle)).size
  );
  const highRiskCounts = teams.map(
    (team) => team.riskFlags.filter((flag) => flag.severity === "high").length
  );

  // Lower standard deviation => fairer distribution across teams.
  const scoreSpread = clampScore(100 - standardDeviation(totalScores) * 3);
  const leadershipSpread = clampScore(
    100 - standardDeviation(highLeaderCounts) * 45
  );
  const communicationSpread = clampScore(
    100 - standardDeviation(communicationDiversity) * 35
  );
  const highRiskSpread = clampScore(
    100 - standardDeviation(highRiskCounts) * 50
  );

  const overall = clampScore(
    scoreSpread * 0.4 +
      leadershipSpread * 0.25 +
      communicationSpread * 0.2 +
      highRiskSpread * 0.15
  );

  const maxHighRiskCount = Math.max(0, ...highRiskCounts);
  const concentratedRiskTeamIds =
    maxHighRiskCount <= 0
      ? []
      : teams
          .filter(
            (team) =>
              team.riskFlags.filter((flag) => flag.severity === "high")
                .length === maxHighRiskCount
          )
          .map((team) => team.id);

  return {
    teams,
    fairness: {
      scoreSpread,
      leadershipSpread,
      communicationSpread,
      highRiskSpread,
      overall,
      concentratedRiskTeamIds
    }
  };
}

function buildRationale(
  teamId: string,
  members: StudentProfile[],
  score: TeamScoreBreakdown
) {
  const memberNames = members.map((member) => member.name).join(", ");
  return `${teamId} was formed with balanced collaboration signals across ${memberNames}. Composite score ${score.total} emphasizes skill coverage (${score.skillDiversity}), availability overlap (${score.availabilityOverlap}), and growth fit (${score.growthOpportunityFit}) while highlighting risks for instructor review.`;
}

/**
 * Rebuilds final team artifacts from an existing set of team/member assignments.
 * Use this after instructor moves so score, rationale, and risk flags stay aligned.
 */
export function buildTeamsFromCandidates(candidates: TeamCandidate[]): Team[] {
  const scoredRoster = scoreTeamsAcrossRoster(candidates);

  return scoredRoster.teams.map((team) => {
    const riskFlags = [...team.riskFlags];

    if (scoredRoster.fairness.concentratedRiskTeamIds.includes(team.id)) {
      riskFlags.push({
        code: "roster_risk_concentration",
        label: "Roster risk concentration",
        severity: "low",
        note: "This team carries the highest share of severe risk signals in current roster."
      });
    }

    return {
      id: team.id,
      members: team.members,
      rationale: buildRationale(team.id, team.members, team.scoreSummary),
      riskFlags,
      scoreSummary: team.scoreSummary,
      support: defaultSupport(team.id, team.members),
      projectTheme: "Course project",
      currentMilestone: null,
      preferredMeetingDurationMin: 60,
      aiOptIn: true,
      teamNorms: [
        "Surface blockers within 24 hours.",
        "Post one async update before the weekly sync.",
        "Ask for clarification before assuming intent."
      ],
      lastPulseAt: null,
      activeMeetingId: null,
      tasks: [],
      meetings: [],
      copilotRuns: []
    };
  });
}

function teamScoreById(candidates: TeamCandidate[]) {
  return scoreTeamsAcrossRoster(candidates).teams.reduce<
    Record<string, number>
  >((acc, team) => {
    acc[team.id] = team.scoreSummary.total;
    return acc;
  }, {});
}

function defaultSupport(teamId: string, members: StudentProfile[]) {
  return {
    charter: `${teamId} charter: align scope, communicate blockers within 24 hours, and review deliverables before submission. Members commit to shared accountability and respectful feedback loops.`,
    suggestedRoleRotation: [
      `${members[0]?.name ?? "Member"} - Facilitator`,
      `${members[1]?.name ?? "Member"} - Tracker`,
      `${members[2]?.name ?? "Member"} - Reviewer`,
      `${members[3]?.name ?? "Member"} - Demo lead`
    ],
    kickoffChecklist: [
      "Agree on communication channel and response expectations",
      "Define milestone owners for week one",
      "Set quality bar and review checklist",
      "Schedule midpoint and pre-demo syncs"
    ]
  };
}

function defaultTeamMetadata() {
  return {
    projectTheme: "Course project",
    currentMilestone: null,
    preferredMeetingDurationMin: 45,
    aiOptIn: true,
    teamNorms: [
      "Share blockers within 24 hours",
      "Keep task owners explicit",
      "Review work before submission"
    ],
    lastPulseAt: null,
    activeMeetingId: null
  };
}

function compareProfileOrder(a: StudentProfile, b: StudentProfile) {
  return a.id.localeCompare(b.id);
}

function cloneTeamCandidates(candidates: TeamCandidate[]) {
  return candidates.map((candidate) => ({
    id: candidate.id,
    members: [...candidate.members]
  }));
}

function objectiveFromScoredRoster(scored: ScoredRoster) {
  const minTeamScore = Math.min(
    ...scored.teams.map((team) => team.scoreSummary.total)
  );
  const averageTeamScore = average(
    scored.teams.map((team) => team.scoreSummary.total)
  );

  return {
    minTeamScore,
    averageTeamScore,
    overallFairness: scored.fairness.overall
  };
}

function isBetterObjective(
  nextObjective: ReturnType<typeof objectiveFromScoredRoster>,
  currentObjective: ReturnType<typeof objectiveFromScoredRoster>
) {
  if (nextObjective.minTeamScore !== currentObjective.minTeamScore) {
    return nextObjective.minTeamScore > currentObjective.minTeamScore;
  }

  if (nextObjective.overallFairness !== currentObjective.overallFairness) {
    return nextObjective.overallFairness > currentObjective.overallFairness;
  }

  return nextObjective.averageTeamScore > currentObjective.averageTeamScore;
}

/**
 * Applies one instructor-requested move (one-way transfer).
 * Use this for manual overrides before re-scoring teams.
 */
export function applyInstructorSwap(
  candidates: TeamCandidate[],
  params: {
    studentId: string;
    fromTeamId: string;
    toTeamId: string;
  }
): TeamCandidate[] {
  const next = cloneTeamCandidates(candidates);

  const fromTeam = next.find((team) => team.id === params.fromTeamId);
  const toTeam = next.find((team) => team.id === params.toTeamId);

  if (!fromTeam || !toTeam || fromTeam.id === toTeam.id) {
    return next;
  }

  const movingIndex = fromTeam.members.findIndex(
    (member) => member.id === params.studentId
  );

  if (movingIndex < 0) {
    return next;
  }

  const [movingStudent] = fromTeam.members.splice(movingIndex, 1);
  toTeam.members.push(movingStudent);

  fromTeam.members.sort(compareProfileOrder);
  toTeam.members.sort(compareProfileOrder);

  return next;
}

/**
 * Applies a direct pairwise swap between two teams.
 * This is the primary full-destination fallback because it preserves team counts.
 */
export function applyPairwiseSwap(
  candidates: TeamCandidate[],
  params: {
    fromTeamId: string;
    toTeamId: string;
    incomingStudentId: string;
    displacedStudentId: string;
  }
): TeamCandidate[] {
  const next = cloneTeamCandidates(candidates);
  const fromTeam = next.find((team) => team.id === params.fromTeamId);
  const toTeam = next.find((team) => team.id === params.toTeamId);

  if (!fromTeam || !toTeam || fromTeam.id === toTeam.id) {
    return next;
  }

  const fromIndex = fromTeam.members.findIndex(
    (member) => member.id === params.incomingStudentId
  );
  const toIndex = toTeam.members.findIndex(
    (member) => member.id === params.displacedStudentId
  );

  if (fromIndex < 0 || toIndex < 0) {
    return next;
  }

  [fromTeam.members[fromIndex], toTeam.members[toIndex]] = [
    toTeam.members[toIndex],
    fromTeam.members[fromIndex]
  ];

  fromTeam.members.sort(compareProfileOrder);
  toTeam.members.sort(compareProfileOrder);

  return next;
}

/**
 * Applies a full-team reroute in one transaction:
 * 1) move the instructor-selected student into the destination team
 * 2) move a displaced destination member into a legal reroute team
 */
export function applyRerouteMove(
  candidates: TeamCandidate[],
  params: {
    studentId: string;
    fromTeamId: string;
    toTeamId: string;
    displacedStudentId: string;
    rerouteTeamId: string;
  }
): TeamCandidate[] {
  const afterIncomingMove = applyInstructorSwap(candidates, {
    studentId: params.studentId,
    fromTeamId: params.fromTeamId,
    toTeamId: params.toTeamId
  });

  return applyInstructorSwap(afterIncomingMove, {
    studentId: params.displacedStudentId,
    fromTeamId: params.toTeamId,
    toTeamId: params.rerouteTeamId
  });
}

function objectiveScore(candidates: TeamCandidate[]) {
  const scored = scoreTeamsAcrossRoster(candidates);
  const objective = objectiveFromScoredRoster(scored);
  return (
    objective.minTeamScore * 1000 +
    objective.overallFairness * 10 +
    objective.averageTeamScore
  );
}

/**
 * Builds the top deterministic swap suggestions when the destination team is full.
 * Ranking favors objective improvement, then fairness improvement, then stable ID order.
 */
export function getTopSwapSuggestions(
  candidates: TeamCandidate[],
  params: {
    studentId: string;
    fromTeamId: string;
    toTeamId: string;
  },
  limit = 3
): RankedSwapOption[] {
  const fromTeam = candidates.find((team) => team.id === params.fromTeamId);
  const toTeam = candidates.find((team) => team.id === params.toTeamId);

  if (!fromTeam || !toTeam) {
    return [];
  }

  const baselineScores = teamScoreById(candidates);
  const baselineFairness = scoreTeamsAcrossRoster(candidates).fairness.overall;
  const baselineObjective = objectiveScore(candidates);

  return [...toTeam.members]
    .sort(compareProfileOrder)
    .map((displacedStudent) => {
      const projectedCandidates = applyPairwiseSwap(candidates, {
        fromTeamId: params.fromTeamId,
        toTeamId: params.toTeamId,
        incomingStudentId: params.studentId,
        displacedStudentId: displacedStudent.id
      });
      const projectedRoster = scoreTeamsAcrossRoster(projectedCandidates);
      const projectedScores = projectedRoster.teams.reduce<
        Record<string, number>
      >((acc, team) => {
        acc[team.id] = team.scoreSummary.total;
        return acc;
      }, {});

      return {
        displacedStudentId: displacedStudent.id,
        displacedStudentName: displacedStudent.name,
        displacedStudentRole: displacedStudent.preferredRole,
        sourceTeamScoreDelta:
          projectedScores[params.fromTeamId] -
          (baselineScores[params.fromTeamId] ?? 0),
        destinationTeamScoreDelta:
          projectedScores[params.toTeamId] -
          (baselineScores[params.toTeamId] ?? 0),
        fairnessDelta: projectedRoster.fairness.overall - baselineFairness,
        legal: true,
        projectedCandidates,
        objectiveGain: objectiveScore(projectedCandidates) - baselineObjective
      };
    })
    .sort((left, right) => {
      if (right.objectiveGain !== left.objectiveGain) {
        return right.objectiveGain - left.objectiveGain;
      }
      if (right.fairnessDelta !== left.fairnessDelta) {
        return right.fairnessDelta - left.fairnessDelta;
      }
      return left.displacedStudentId.localeCompare(right.displacedStudentId);
    })
    .slice(0, limit);
}

/**
 * Lists legal reroute targets for a displaced student after a full-destination move.
 * The source team is always considered because it just lost one member.
 */
export function getLegalRerouteTargets(
  candidates: TeamCandidate[],
  params: {
    fromTeamId: string;
    toTeamId: string;
  }
): MoveTargetOption[] {
  const fromTeam = candidates.find((team) => team.id === params.fromTeamId);

  return candidates
    .filter((team) => team.id !== params.toTeamId)
    .filter(
      (team) =>
        team.id === params.fromTeamId || team.members.length < MAX_TEAM_SIZE
    )
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((team) => {
      const memberCount =
        team.id === params.fromTeamId
          ? Math.max(0, (fromTeam?.members.length ?? 0) - 1)
          : team.members.length;

      return {
        teamId: team.id,
        teamName: team.id,
        memberCount,
        willBeInBounds: memberCount + 1 <= MAX_TEAM_SIZE
      };
    });
}

/**
 * Finds the best pairwise swap to improve roster quality.
 * Deterministic tie-breaking comes from sorted team/member iteration order.
 */
export function findBestSwapRepair(
  candidates: TeamCandidate[]
): SwapProposal | null {
  const baselineScored = scoreTeamsAcrossRoster(candidates);
  const baselineObjective = objectiveFromScoredRoster(baselineScored);

  let bestProposal: SwapProposal | null = null;
  let bestObjective = baselineObjective;

  const sortedCandidates = cloneTeamCandidates(candidates).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  sortedCandidates.forEach((team) => team.members.sort(compareProfileOrder));

  for (let i = 0; i < sortedCandidates.length; i += 1) {
    for (let j = i + 1; j < sortedCandidates.length; j += 1) {
      const left = sortedCandidates[i];
      const right = sortedCandidates[j];

      for (const leftMember of left.members) {
        for (const rightMember of right.members) {
          const swapped = cloneTeamCandidates(sortedCandidates);
          const leftTeam = swapped.find((team) => team.id === left.id);
          const rightTeam = swapped.find((team) => team.id === right.id);
          if (!leftTeam || !rightTeam) continue;

          const leftIndex = leftTeam.members.findIndex(
            (member) => member.id === leftMember.id
          );
          const rightIndex = rightTeam.members.findIndex(
            (member) => member.id === rightMember.id
          );

          if (leftIndex < 0 || rightIndex < 0) continue;

          [leftTeam.members[leftIndex], rightTeam.members[rightIndex]] = [
            rightTeam.members[rightIndex],
            leftTeam.members[leftIndex]
          ];

          const scored = scoreTeamsAcrossRoster(swapped);
          const objective = objectiveFromScoredRoster(scored);

          if (isBetterObjective(objective, bestObjective)) {
            bestObjective = objective;
            bestProposal = {
              fromTeamId: left.id,
              toTeamId: right.id,
              fromStudentId: leftMember.id,
              toStudentId: rightMember.id,
              beforeMinScore: baselineObjective.minTeamScore,
              afterMinScore: objective.minTeamScore,
              beforeFairness: baselineObjective.overallFairness,
              afterFairness: objective.overallFairness
            };
          }
        }
      }
    }
  }

  return bestProposal;
}

/**
 * Applies small deterministic swap repairs to improve minimum team quality.
 * Hackathon-friendly: bounded iterations and no heavy optimization library.
 */
export function repairTeamsBySwap(
  candidates: TeamCandidate[],
  maxIterations = SCORING_TUNABLES.repairIterations
) {
  let current = cloneTeamCandidates(candidates);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const proposal = findBestSwapRepair(current);
    if (!proposal) break;

    const improved = cloneTeamCandidates(current);
    const left = improved.find((team) => team.id === proposal.fromTeamId);
    const right = improved.find((team) => team.id === proposal.toTeamId);
    if (!left || !right) break;

    const leftIndex = left.members.findIndex(
      (member) => member.id === proposal.fromStudentId
    );
    const rightIndex = right.members.findIndex(
      (member) => member.id === proposal.toStudentId
    );

    if (leftIndex < 0 || rightIndex < 0) break;

    [left.members[leftIndex], right.members[rightIndex]] = [
      right.members[rightIndex],
      left.members[leftIndex]
    ];

    const beforeObjective = objectiveFromScoredRoster(
      scoreTeamsAcrossRoster(current)
    );
    const afterObjective = objectiveFromScoredRoster(
      scoreTeamsAcrossRoster(improved)
    );

    // Stop if no meaningful objective improvement.
    if (!isBetterObjective(afterObjective, beforeObjective)) {
      break;
    }

    current = improved;
  }

  return current;
}

/**
 * Main deterministic team generator.
 * 1) Greedy assignment with scoreTeam
 * 2) Optional bounded swap repair for fairness/min-score quality
 * 3) Final scoring + rationale artifacts
 */
export function generateTeamsDeterministic(
  profiles: StudentProfile[],
  teamSize = 4
): Team[] {
  const sortedProfiles = [...profiles].sort(compareProfileOrder);
  const teamCount = Math.max(1, Math.floor(sortedProfiles.length / teamSize));

  const buckets: StudentProfile[][] = Array.from(
    { length: teamCount },
    () => []
  );

  const leaders = sortedProfiles.filter(
    (profile) => profile.leadershipSignal === "high"
  );
  const nonLeaders = sortedProfiles.filter(
    (profile) => profile.leadershipSignal !== "high"
  );

  // Seed each team with one strong leadership signal when possible.
  leaders.forEach((leader, index) => {
    if (buckets[index]) buckets[index].push(leader);
  });

  const placementPool = [...nonLeaders, ...leaders.slice(teamCount)].sort(
    compareProfileOrder
  );

  placementPool.forEach((candidate) => {
    let bestTeamIndex = 0;
    let bestProjectedScore = -Infinity;

    buckets.forEach((teamMembers, index) => {
      if (teamMembers.length >= teamSize) return;

      const projectedMembers = [...teamMembers, candidate];
      const projected = scoreTeam(projectedMembers);

      // Small bonus for filling shorter teams keeps roster balanced.
      const placementBonus =
        teamMembers.length < Math.floor(sortedProfiles.length / teamCount)
          ? 4
          : 0;
      const projectedScore = projected.scoreSummary.total + placementBonus;

      if (projectedScore > bestProjectedScore) {
        bestProjectedScore = projectedScore;
        bestTeamIndex = index;
      }
    });

    buckets[bestTeamIndex].push(candidate);
  });

  const initialCandidates: TeamCandidate[] = buckets.map((members, index) => ({
    id: `Team-${index + 1}`,
    members: [...members].sort(compareProfileOrder)
  }));

  const repairedCandidates = repairTeamsBySwap(initialCandidates);
  return buildTeamsFromCandidates(repairedCandidates);
}
