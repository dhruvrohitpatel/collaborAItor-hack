import { z } from "zod";

import { DEFAULT_TEAM_SIZE, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "@/lib/config";

export const availabilitySlotSchema = z.object({
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
});

export const studentIntakeSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  timezone: z.string().min(2),
  availability: z.array(availabilitySlotSchema).min(1),
  strengths: z.array(z.string().min(1)).min(1),
  growthAreas: z.array(z.string().min(1)).min(1),
  preferredRole: z.string().min(2),
  communicationStyle: z.enum([
    "direct",
    "collaborative",
    "reflective",
    "facilitative",
    "analytical"
  ]),
  collaborationPreferences: z.array(z.string().min(1)).min(1),
  shortReflection: z.string().min(10)
});

/**
 * Validates individual risk flags surfaced during profile generation.
 * Codes are short snake_case identifiers (e.g. "limited_availability").
 *
 * @example
 * {
 *   code: "limited_availability",
 *   label: "Limited weekly availability",
 *   severity: "medium",
 *   note: "Only 4 h/week overlap with standard team windows"
 * }
 */
export const riskFlagSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  note: z.string()
});

/**
 * Full collaboration profile schema — the validated contract for every
 * profile object returned by the Gemini endpoint or the mock fallback.
 *
 * Extends studentIntakeSchema with AI-generated fields and risk signals so
 * downstream consumers (team engine, profile card, instructor view) can rely
 * on a single, strict shape.
 *
 * @example
 * {
 *   id: "s-01",
 *   name: "Jordan Lee",
 *   email: "jordan@example.edu",
 *   timezone: "America/Chicago",
 *   availability: [{ day: "Mon", start: "09:00", end: "11:00" }],
 *   strengths: ["systems thinking", "async communication"],
 *   growthAreas: ["public speaking", "conflict resolution"],
 *   preferredRole: "backend engineer",
 *   communicationStyle: "analytical",
 *   collaborationPreferences: ["async-first", "clear task ownership"],
 *   shortReflection: "I thrive when problems are well-scoped and I can work heads-down.",
 *   profileSummary: "Jordan is a detail-oriented backend engineer who communicates...",
 *   inferredTags: ["async-first", "detail-oriented", "systems-thinker"],
 *   leadershipSignal: "emerging",
 *   riskFlags: [
 *     {
 *       code: "limited_availability",
 *       label: "Limited weekly availability",
 *       severity: "medium",
 *       note: "Only 4 h/week overlap with standard team windows"
 *     }
 *   ],
 *   profileSource: "ai",
 *   profileGeneratedAt: "2026-04-04T12:00:00.000Z"
 * }
 */
export const collaborationProfileSchema = studentIntakeSchema.extend({
  profileSummary: z.string().min(10),
  inferredTags: z.array(z.string().min(1)).min(1),
  leadershipSignal: z.enum(["high", "medium", "emerging"]),
  riskFlags: z.array(riskFlagSchema).default([]),
  profileSource: z.enum(["mock", "ai"]),
  profileGeneratedAt: z.string().datetime()
});

export const teamScoreBreakdownSchema = z.object({
  skillDiversity: z.number(),
  availabilityOverlap: z.number(),
  communicationBalance: z.number(),
  leadershipDistribution: z.number(),
  growthOpportunityFit: z.number(),
  riskPenalty: z.number(),
  total: z.number()
});

export const teamSupportArtifactsSchema = z.object({
  charter: z.string().min(1),
  suggestedRoleRotation: z.array(z.string().min(1)),
  kickoffChecklist: z.array(z.string().min(1))
});

export const teamTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  status: z.enum(["todo", "in_progress", "blocked", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  assigneeStudentId: z.string().nullable().default(null),
  source: z.enum(["manual", "meeting_followup", "weekly_pulse", "copilot"]),
  sourceRunId: z.string().nullable().default(null),
  sourceMeetingId: z.string().nullable().default(null),
  dueAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdByStudentId: z.string().nullable().default(null)
});

export const teamMeetingSlotSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  score: z.number().min(0).max(100),
  memberIdsAvailable: z.array(z.string().min(1))
});

export const teamMeetingSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["proposed", "scheduled", "completed", "cancelled"]),
  proposedSlots: z.array(teamMeetingSlotSchema).default([]),
  selectedSlot: z
    .object({
      startAt: z.string().datetime(),
      endAt: z.string().datetime()
    })
    .nullable()
    .default(null),
  durationMin: z.number().int().min(15).max(240),
  timezone: z.string().min(2),
  calendarEventId: z.string().nullable().default(null),
  calendarHtmlLink: z.string().nullable().default(null),
  meetUrl: z.string().nullable().default(null),
  agenda: z.string().nullable().default(null),
  notesRaw: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
  openQuestions: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdByStudentId: z.string().nullable().default(null)
});

export const teamCopilotPreviewSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  bullets: z.array(z.string()).default([])
});

export const teamCopilotPreviewSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  sections: z.array(teamCopilotPreviewSectionSchema).default([])
});

export const teamCopilotRunSchema = z.object({
  id: z.string().min(1),
  intent: z.enum([
    "rewrite_message",
    "schedule_meeting",
    "meeting_followup",
    "weekly_pulse"
  ]),
  status: z.enum(["preview", "approved", "executed", "failed"]),
  actorStudentId: z.string().nullable().default(null),
  inputSnapshot: z.record(z.unknown()).default({}),
  preview: teamCopilotPreviewSchema,
  outputSummary: z.string().min(1),
  suggestedActions: z.array(z.string()).default([]),
  requiresApproval: z.boolean(),
  persistedRefs: z
    .object({
      meetingId: z.string().nullable().optional(),
      taskIds: z.array(z.string()).optional()
    })
    .nullable()
    .default(null),
  approvedAt: z.string().datetime().nullable().default(null),
  executedAt: z.string().datetime().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  createdAt: z.string().datetime()
});

export const googleConnectionSchema = z.object({
  id: z.string().min(1),
  firebaseUid: z.string().nullable().default(null),
  email: z.string().email(),
  scopes: z.array(z.string()).default([]),
  refreshTokenEncrypted: z.string().min(1),
  accessTokenEncrypted: z.string().nullable().default(null),
  expiry: z.string().datetime().nullable().default(null),
  connectedAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable().default(null)
});

export const teamSchema = z.object({
  id: z.string().min(1),
  members: z.array(collaborationProfileSchema),
  rationale: z.string().min(1),
  riskFlags: z.array(riskFlagSchema),
  scoreSummary: teamScoreBreakdownSchema,
  support: teamSupportArtifactsSchema,
  projectTheme: z.string().default("Course project"),
  currentMilestone: z.string().nullable().default(null),
  preferredMeetingDurationMin: z.number().int().min(15).max(240).default(60),
  aiOptIn: z.boolean().default(true),
  teamNorms: z.array(z.string()).default([]),
  lastPulseAt: z.string().datetime().nullable().default(null),
  activeMeetingId: z.string().nullable().default(null),
  tasks: z.array(teamTaskSchema).default([]),
  meetings: z.array(teamMeetingSchema).default([]),
  copilotRuns: z.array(teamCopilotRunSchema).default([])
});

export const demoStateMetaSchema = z.object({
  studentsUpdatedAt: z.string().datetime(),
  profilesUpdatedAt: z.string().datetime().nullable().default(null),
  teamsUpdatedAt: z.string().datetime().nullable().default(null)
});

export const generateTeamsInputSchema = z.object({
  teamSize: z.number().int().min(MIN_TEAM_SIZE).max(MAX_TEAM_SIZE).default(DEFAULT_TEAM_SIZE)
});

export const moveStudentInputSchema = z.object({
  studentId: z.string().min(1),
  fromTeamId: z.string().min(1),
  toTeamId: z.string().min(1)
});

const moveActionBaseSchema = z.object({
  studentId: z.string().min(1),
  fromTeamId: z.string().min(1),
  toTeamId: z.string().min(1)
});

export const moveStudentRequestSchema = z.discriminatedUnion("action", [
  moveActionBaseSchema.extend({
    action: z.literal("simple_move")
  }),
  moveActionBaseSchema.extend({
    action: z.literal("analyze_move")
  }),
  moveActionBaseSchema.extend({
    action: z.literal("force_override_move")
  }),
  moveActionBaseSchema.extend({
    action: z.literal("swap_move"),
    displacedStudentId: z.string().min(1)
  }),
  moveActionBaseSchema.extend({
    action: z.literal("reroute_move"),
    displacedStudentId: z.string().min(1),
    rerouteTeamId: z.string().min(1)
  })
]);

export type StudentIntakeInput = z.infer<typeof studentIntakeSchema>;
export type GenerateTeamsInput = z.infer<typeof generateTeamsInputSchema>;
export type MoveStudentInput = z.infer<typeof moveStudentInputSchema>;
export type MoveStudentRequestInput = z.infer<typeof moveStudentRequestSchema>;
export type RiskFlagInput = z.infer<typeof riskFlagSchema>;
export type CollaborationProfile = z.infer<typeof collaborationProfileSchema>;
export type DemoStateMetaInput = z.infer<typeof demoStateMetaSchema>;
export type GoogleConnectionInput = z.infer<typeof googleConnectionSchema>;
