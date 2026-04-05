import type { Team } from "@/types/domain";

const DEFAULT_TEAM_NORMS = [
  "Surface blockers within 24 hours.",
  "Post one async update before the weekly sync.",
  "Ask for clarification before assuming intent."
];

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeTeamWorkspace(team: Team): Team {
  return {
    ...team,
    projectTheme: team.projectTheme ?? "Course project",
    currentMilestone: team.currentMilestone ?? null,
    preferredMeetingDurationMin: team.preferredMeetingDurationMin ?? 60,
    aiOptIn: team.aiOptIn ?? true,
    teamNorms:
      team.teamNorms && team.teamNorms.length > 0
        ? unique(team.teamNorms)
        : [...DEFAULT_TEAM_NORMS],
    lastPulseAt: team.lastPulseAt ?? null,
    activeMeetingId: team.activeMeetingId ?? null,
    tasks: team.tasks ?? [],
    meetings: team.meetings ?? [],
    copilotRuns: team.copilotRuns ?? []
  };
}

export function mergeTeamWorkspace(previousTeams: Team[], nextTeams: Team[]) {
  const previousById = new Map(
    previousTeams.map((team) => [team.id, normalizeTeamWorkspace(team)])
  );

  return nextTeams.map((team) => {
    const previous = previousById.get(team.id);
    const normalized = normalizeTeamWorkspace(team);

    if (!previous) {
      return normalized;
    }

    return {
      ...normalized,
      projectTheme: previous.projectTheme,
      currentMilestone: previous.currentMilestone,
      preferredMeetingDurationMin: previous.preferredMeetingDurationMin,
      aiOptIn: previous.aiOptIn,
      teamNorms: previous.teamNorms,
      lastPulseAt: previous.lastPulseAt,
      activeMeetingId: previous.activeMeetingId,
      tasks: previous.tasks,
      meetings: previous.meetings,
      copilotRuns: previous.copilotRuns
    };
  });
}
