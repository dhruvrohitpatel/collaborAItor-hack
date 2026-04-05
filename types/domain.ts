export type CommunicationStyle =
  | "direct"
  | "collaborative"
  | "reflective"
  | "facilitative"
  | "analytical";

export type LeadershipSignal = "high" | "medium" | "emerging";

export type RiskSeverity = "low" | "medium" | "high";

export type AvailabilitySlot = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  start: string;
  end: string;
};

export type StudentIntake = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  availability: AvailabilitySlot[];
  strengths: string[];
  growthAreas: string[];
  preferredRole: string;
  communicationStyle: CommunicationStyle;
  collaborationPreferences: string[];
  shortReflection: string;
};

export type StudentProfile = StudentIntake & {
  profileSummary: string;
  inferredTags: string[];
  leadershipSignal: LeadershipSignal;
  profileSource: "mock" | "ai";
  profileGeneratedAt: string;
};

export type RiskFlag = {
  code: string;
  label: string;
  severity: RiskSeverity;
  note: string;
};

export type TeamScoreBreakdown = {
  skillDiversity: number;
  availabilityOverlap: number;
  communicationBalance: number;
  leadershipDistribution: number;
  growthOpportunityFit: number;
  riskPenalty: number;
  total: number;
};

export type TeamSupportArtifacts = {
  charter: string;
  suggestedRoleRotation: string[];
  kickoffChecklist: string[];
};

export type Team = {
  id: string;
  members: StudentProfile[];
  rationale: string;
  riskFlags: RiskFlag[];
  scoreSummary: TeamScoreBreakdown;
  support: TeamSupportArtifacts;
};

export type DemoState = {
  students: StudentIntake[];
  profiles: StudentProfile[];
  teams: Team[];
  updatedAt: string;
};
