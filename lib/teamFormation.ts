import { clampScore } from "@/lib/utils";
import type { RiskFlag, StudentProfile, Team, TeamScoreBreakdown } from "@/types/domain";

const WEIGHTS = {
  // Tune these values for different formation priorities.
  skillDiversity: 0.25,
  availabilityOverlap: 0.2,
  communicationBalance: 0.15,
  leadershipDistribution: 0.15,
  growthOpportunityFit: 0.25
};

function normalize(value: number, max: number) {
  if (max <= 0) return 0;
  return clampScore((value / max) * 100);
}

function availabilityToSet(profile: StudentProfile) {
  return new Set(
    profile.availability.map((slot) => `${slot.day}-${slot.start}-${slot.end}`)
  );
}

function availabilityOverlapScore(members: StudentProfile[]) {
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

function skillDiversityScore(members: StudentProfile[]) {
  const uniqueStrengths = new Set(members.flatMap((member) => member.strengths));
  const expected = members.length * 2;
  return normalize(uniqueStrengths.size, expected);
}

function communicationBalanceScore(members: StudentProfile[]) {
  const styleCounts = new Map<string, number>();
  members.forEach((member) => {
    styleCounts.set(member.communicationStyle, (styleCounts.get(member.communicationStyle) || 0) + 1);
  });

  const uniqueStyles = styleCounts.size;
  const maxStyleCount = Math.max(...styleCounts.values());
  const diversity = normalize(uniqueStyles, Math.min(members.length, 4));
  const concentrationPenalty = clampScore((maxStyleCount / members.length) * 100) - 25;

  return clampScore(diversity - concentrationPenalty * 0.5);
}

function leadershipDistributionScore(members: StudentProfile[]) {
  const high = members.filter((member) => member.leadershipSignal === "high").length;
  const medium = members.filter((member) => member.leadershipSignal === "medium").length;

  if (high === 1) return 100;
  if (high === 0 && medium >= 2) return 75;
  if (high >= 2) return 65;
  return 55;
}

function growthOpportunityFitScore(members: StudentProfile[]) {
  const strengths = new Set(members.flatMap((member) => member.strengths.map((value) => value.toLowerCase())));
  const growthAreas = members.flatMap((member) =>
    member.growthAreas.map((value) => value.toLowerCase())
  );

  const matches = growthAreas.filter((growth) => strengths.has(growth)).length;
  return normalize(matches, growthAreas.length || 1);
}

function deriveRiskFlags(
  members: StudentProfile[],
  score: Omit<TeamScoreBreakdown, "total" | "riskPenalty">
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (score.availabilityOverlap < 35) {
    flags.push({
      code: "availability_low",
      label: "Low schedule overlap",
      severity: "high",
      note: "Limited shared collaboration windows may slow coordination."
    });
  }

  if (score.communicationBalance < 45) {
    flags.push({
      code: "communication_monoculture",
      label: "Communication style concentration",
      severity: "medium",
      note: "Similar communication tendencies could reduce perspective breadth."
    });
  }

  const highLeaders = members.filter((member) => member.leadershipSignal === "high").length;
  if (highLeaders === 0) {
    flags.push({
      code: "leadership_gap",
      label: "Leadership coverage gap",
      severity: "medium",
      note: "Consider explicit facilitation support during kickoff."
    });
  }

  if (score.skillDiversity < 40) {
    flags.push({
      code: "skill_overlap",
      label: "Skill concentration",
      severity: "low",
      note: "Team strengths are clustered; add role rotation checkpoints."
    });
  }

  return flags;
}

function riskPenalty(flags: RiskFlag[]) {
  return flags.reduce((total, flag) => {
    if (flag.severity === "high") return total + 18;
    if (flag.severity === "medium") return total + 10;
    return total + 5;
  }, 0);
}

function evaluateTeam(members: StudentProfile[]): {
  scoreSummary: TeamScoreBreakdown;
  riskFlags: RiskFlag[];
} {
  const partial = {
    skillDiversity: skillDiversityScore(members),
    availabilityOverlap: availabilityOverlapScore(members),
    communicationBalance: communicationBalanceScore(members),
    leadershipDistribution: leadershipDistributionScore(members),
    growthOpportunityFit: growthOpportunityFitScore(members)
  };

  const flags = deriveRiskFlags(members, partial);
  const penalty = riskPenalty(flags);

  const weighted =
    partial.skillDiversity * WEIGHTS.skillDiversity +
    partial.availabilityOverlap * WEIGHTS.availabilityOverlap +
    partial.communicationBalance * WEIGHTS.communicationBalance +
    partial.leadershipDistribution * WEIGHTS.leadershipDistribution +
    partial.growthOpportunityFit * WEIGHTS.growthOpportunityFit;

  const total = clampScore(weighted - penalty * 0.6);

  return {
    scoreSummary: {
      ...partial,
      riskPenalty: penalty,
      total
    },
    riskFlags: flags
  };
}

function buildRationale(teamId: string, members: StudentProfile[], score: TeamScoreBreakdown) {
  const memberNames = members.map((member) => member.name).join(", ");
  return `${teamId} was formed with balanced collaboration signals across ${memberNames}. Composite score ${score.total} emphasizes skill diversity (${score.skillDiversity}) and growth opportunity fit (${score.growthOpportunityFit}) while flagging coordination risks for instructor review.`;
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

function compareProfileOrder(a: StudentProfile, b: StudentProfile) {
  return a.id.localeCompare(b.id);
}

export function generateTeamsDeterministic(
  profiles: StudentProfile[],
  teamSize = 4
): Team[] {
  const sorted = [...profiles].sort(compareProfileOrder);
  const teamCount = Math.max(1, Math.floor(sorted.length / teamSize));

  const teams: StudentProfile[][] = Array.from({ length: teamCount }, () => []);

  const leaders = sorted.filter((profile) => profile.leadershipSignal === "high");
  const remaining = sorted.filter((profile) => profile.leadershipSignal !== "high");

  leaders.forEach((leader, index) => {
    if (teams[index]) teams[index].push(leader);
  });

  const pool = [...remaining, ...leaders.slice(teamCount)].sort(compareProfileOrder);

  pool.forEach((candidate) => {
    let bestTeamIndex = 0;
    let bestScore = -Infinity;

    teams.forEach((teamMembers, index) => {
      if (teamMembers.length >= teamSize) return;

      const projectedMembers = [...teamMembers, candidate];
      const evaluation = evaluateTeam(projectedMembers);
      const placementBonus = teamMembers.length < Math.floor(sorted.length / teamCount) ? 4 : 0;
      const projectedScore = evaluation.scoreSummary.total + placementBonus;

      if (projectedScore > bestScore) {
        bestScore = projectedScore;
        bestTeamIndex = index;
      }
    });

    teams[bestTeamIndex].push(candidate);
  });

  return teams.map((members, index) => {
    const teamId = `Team-${index + 1}`;
    const { scoreSummary, riskFlags } = evaluateTeam(members);

    return {
      id: teamId,
      members,
      rationale: buildRationale(teamId, members, scoreSummary),
      riskFlags,
      scoreSummary,
      support: defaultSupport(teamId, members)
    };
  });
}
