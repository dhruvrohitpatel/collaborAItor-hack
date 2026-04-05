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

export type StudentRosterRecord = {
  section?: string;
  cohort?: string;
  rosterSource?: "seed" | "manual" | "import";
};

export type StudentQuestionnaire = {
  classPriority?: "low" | "medium" | "high";
  weeklyCapacityHours?: number;
  externalCommitments?: string;
  scheduleConfidence?: "tight" | "manageable" | "flexible";
  academicConfidence?: "needs_support" | "steady" | "strong";
  priorExperience?: string[];
  communicationHabits?: string[];
  leadershipPreference?: "avoid" | "supporting" | "comfortable" | "prefer";
  collaborationStylePreferences?: string[];
  classGoals?: string[];
  openReflection?: string;
  completedAt?: string;
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
  roster?: StudentRosterRecord;
  questionnaire?: StudentQuestionnaire;
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

export type TeamTaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type TeamTaskPriority = "low" | "medium" | "high";

export type TeamTaskSource =
  | "manual"
  | "meeting_followup"
  | "weekly_pulse"
  | "copilot";

export type TeamTask = {
  id: string;
  title: string;
  description: string;
  status: TeamTaskStatus;
  priority: TeamTaskPriority;
  assigneeStudentId: string | null;
  source: TeamTaskSource;
  sourceRunId: string | null;
  sourceMeetingId: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByStudentId: string | null;
};

export type TeamMeetingStatus =
  | "proposed"
  | "scheduled"
  | "completed"
  | "cancelled";

export type TeamMeetingSlot = {
  startAt: string;
  endAt: string;
  score: number;
  memberIdsAvailable: string[];
};

export type TeamMeeting = {
  id: string;
  status: TeamMeetingStatus;
  proposedSlots: TeamMeetingSlot[];
  selectedSlot: {
    startAt: string;
    endAt: string;
  } | null;
  durationMin: number;
  timezone: string;
  calendarEventId: string | null;
  calendarHtmlLink: string | null;
  meetUrl: string | null;
  agenda: string | null;
  notesRaw: string | null;
  summary: string | null;
  openQuestions: string[];
  createdAt: string;
  updatedAt: string;
  createdByStudentId: string | null;
};

export type TeamCopilotIntent =
  | "rewrite_message"
  | "schedule_meeting"
  | "meeting_followup"
  | "weekly_pulse";

export type TeamCopilotRunStatus =
  | "preview"
  | "approved"
  | "executed"
  | "failed";

export type TeamCopilotPreviewSection = {
  title: string;
  body: string;
  bullets: string[];
};

export type TeamCopilotPreview = {
  headline: string;
  summary: string;
  sections: TeamCopilotPreviewSection[];
};

export type TeamCopilotRun = {
  id: string;
  intent: TeamCopilotIntent;
  status: TeamCopilotRunStatus;
  actorStudentId: string | null;
  inputSnapshot: Record<string, unknown>;
  preview: TeamCopilotPreview;
  outputSummary: string;
  suggestedActions: string[];
  requiresApproval: boolean;
  persistedRefs: {
    meetingId?: string | null;
    taskIds?: string[];
  } | null;
  approvedAt: string | null;
  executedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type Team = {
  id: string;
  members: StudentProfile[];
  rationale: string;
  riskFlags: RiskFlag[];
  scoreSummary: TeamScoreBreakdown;
  support: TeamSupportArtifacts;
  projectTheme: string;
  currentMilestone: string | null;
  preferredMeetingDurationMin: number;
  aiOptIn: boolean;
  teamNorms: string[];
  lastPulseAt: string | null;
  activeMeetingId: string | null;
  tasks: TeamTask[];
  meetings: TeamMeeting[];
  copilotRuns: TeamCopilotRun[];
};

export type BadgeSubjectType = "student" | "team";

export type BadgeType = "good_standing";

export type BadgeProofStatus =
  | "none"
  | "reference_prepared"
  | "anchored_devnet";

export type BadgeCredential = {
  id: string;
  subjectType: BadgeSubjectType;
  subjectId: string;
  badgeType: BadgeType;
  isActive: boolean;
  issuedAt: string | null;
  updatedAt: string;
  reasonSummary: string;
  solanaNetwork: "devnet";
  solanaReference: string | null;
  transactionSignature: string | null;
  proofStatus: BadgeProofStatus;
};

export type MoveAction =
  | "simple_move"
  | "analyze_move"
  | "swap_move"
  | "reroute_move"
  | "force_override_move";

export type MoveStudentRequest =
  | {
      action: "simple_move" | "analyze_move" | "force_override_move";
      studentId: string;
      fromTeamId: string;
      toTeamId: string;
    }
  | {
      action: "swap_move";
      studentId: string;
      fromTeamId: string;
      toTeamId: string;
      displacedStudentId: string;
    }
  | {
      action: "reroute_move";
      studentId: string;
      fromTeamId: string;
      toTeamId: string;
      displacedStudentId: string;
      rerouteTeamId: string;
    };

export type MoveStudentOption = {
  studentId: string;
  studentName: string;
  preferredRole: string;
};

export type MoveTargetOption = {
  teamId: string;
  teamName: string;
  memberCount: number;
  willBeInBounds: boolean;
};

export type SuggestedSwapOption = {
  displacedStudentId: string;
  displacedStudentName: string;
  displacedStudentRole: string;
  sourceTeamScoreDelta: number;
  destinationTeamScoreDelta: number;
  fairnessDelta: number;
  legal: boolean;
};

export type DestinationFullResolution = {
  destinationTeamId: string;
  destinationTeamName: string;
  currentSize: number;
  maxSize: number;
  suggestedSwaps: SuggestedSwapOption[];
  destinationMembers: MoveStudentOption[];
  rerouteTargets: MoveTargetOption[];
};

export type MoveStudentResponse =
  | {
      ok: true;
      status: "moved";
      resolution:
        | "simple_move"
        | "swap_move"
        | "reroute_move"
        | "force_override_move";
      teams: Team[];
    }
  | {
      ok: true;
      status: "destination_full";
      resolution: DestinationFullResolution;
    }
  | {
      ok: false;
      error: string;
    };

export type DemoState = {
  students: StudentIntake[];
  profiles: StudentProfile[];
  teams: Team[];
  studentsUpdatedAt: string;
  profilesUpdatedAt: string | null;
  teamsUpdatedAt: string | null;
  profilesStale: boolean;
  teamsStale: boolean;
  updatedAt: string;
};

/** A single message event — content is excluded to keep analysis privacy-preserving. */
export type TeamMessage = {
  memberId: string;
  memberName: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Proxy for contribution volume without exposing message text. */
  wordCount: number;
};

/** Per-member participation summary computed from a message window. */
export type ParticipationSignal = {
  memberId: string;
  memberName: string;
  messageCount: number;
  wordCount: number;
  /** Percentage of total team messages (0–100). */
  sharePercent: number;
  /** ISO timestamp of most recent message, or "never". */
  lastActiveAt: string;
  daysSilent: number;
};

/** Instructor-facing flag produced by the coaching agent. */
export type CoachingAlert = {
  flaggedMember: string;
  memberId: string;
  /** Non-judgmental explanation referencing specific signals. */
  reason: string;
  /** Concrete follow-up suggestion for the instructor. */
  suggestedFollowUp: string;
  severity: "low" | "medium" | "high";
  participationShare: number;
  daysSilent: number;
};
