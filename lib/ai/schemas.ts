import { z } from "zod";

import { riskFlagSchema, studentIntakeSchema } from "@/lib/schemas";

export const aiProfileRequestSchema = z.object({
  student: studentIntakeSchema
});

export const aiProfileResponseSchema = z.object({
  profileSummary: z.string().min(10),
  inferredTags: z.array(z.string().min(1)).min(1),
  leadershipSignal: z.enum(["high", "medium", "emerging"]),
  riskFlags: z.array(riskFlagSchema).default([]),
  profileSource: z.enum(["mock", "ai"]).default("mock")
});

export const aiGenerateTeamsRationaleRequestSchema = z.object({
  teamId: z.string(),
  memberNames: z.array(z.string()).min(1),
  scoreSummary: z.object({
    skillDiversity: z.number(),
    availabilityOverlap: z.number(),
    communicationBalance: z.number(),
    leadershipDistribution: z.number(),
    growthOpportunityFit: z.number(),
    riskPenalty: z.number(),
    total: z.number()
  }),
  riskFlags: z.array(
    z.object({
      label: z.string(),
      severity: z.enum(["low", "medium", "high"])
    })
  )
});

export const aiGenerateTeamsRationaleResponseSchema = z.object({
  rationale: z.string()
});

export const aiCharterRequestSchema = z.object({
  teamName: z.string().min(1),
  memberNames: z.array(z.string().min(1)).min(1),
  projectTheme: z.string().default("Course project"),
  /** Communication styles drawn from member profiles — used to write specific norms. */
  communicationStyles: z.array(z.string()).default([]),
  /** Active risk flags — addressed in accountability section of the charter. */
  riskFlags: z
    .array(z.object({ label: z.string(), severity: z.enum(["low", "medium", "high"]) }))
    .default([])
});

export const aiCharterResponseSchema = z.object({
  charter: z.string().min(20),
  suggestedRoleRotation: z.array(z.string().min(1)).min(1),
  kickoffChecklist: z.array(z.string().min(1)).min(3).max(6)
});

export const aiSummarizeMeetingRequestSchema = z.object({
  notes: z.string().min(10)
});

/**
 * Structured meeting summary designed for direct copy-paste into task trackers or docs.
 *
 * @example
 * {
 *   summary: "The team reviewed sprint progress and unblocked the auth integration...",
 *   actionItems: [
 *     { task: "Finish auth token refresh flow", owner: "Alex" },
 *     { task: "Update README with setup steps", owner: "" }
 *   ],
 *   openQuestions: ["Which environment should the integration test run against?"]
 * }
 */
export const aiSummarizeMeetingResponseSchema = z.object({
  summary: z.string().min(10),
  actionItems: z.array(
    z.object({
      task: z.string().min(1),
      /** Empty string means no owner was identified. */
      owner: z.string()
    })
  ).min(1),
  openQuestions: z.array(z.string()).default([])
});

export const aiRewriteMessageRequestSchema = z.object({
  message: z.string().min(5),
  tone: z.enum(["polite", "direct", "encouraging", "professional"]),
  audience: z.string().min(2)
});

export const aiRewriteMessageResponseSchema = z.object({
  rewrittenMessage: z.string().min(10),
  /** One sentence explaining the key rewrite decision (tone shift, softened language, etc.). */
  notes: z.string().min(5)
});

export type AIProfileRequest = z.infer<typeof aiProfileRequestSchema>;
export type AIProfileResponse = z.infer<typeof aiProfileResponseSchema>;
export type AIGenerateTeamsRationaleRequest = z.infer<typeof aiGenerateTeamsRationaleRequestSchema>;
export type AIGenerateTeamsRationaleResponse = z.infer<typeof aiGenerateTeamsRationaleResponseSchema>;
export type AICharterRequest = z.infer<typeof aiCharterRequestSchema>;
export type AICharterResponse = z.infer<typeof aiCharterResponseSchema>;
export type AIRewriteMessageRequest = z.infer<typeof aiRewriteMessageRequestSchema>;
export type AIRewriteMessageResponse = z.infer<typeof aiRewriteMessageResponseSchema>;

// ── Coaching agent ─────────────────────────────────────────────────────────

export const teamMessageSchema = z.object({
  memberId: z.string().min(1),
  memberName: z.string().min(1),
  timestamp: z.string().datetime(),
  wordCount: z.number().int().min(0)
});

export const aiCoachingRequestSchema = z.object({
  teamId: z.string().min(1),
  members: z.array(z.object({ id: z.string(), name: z.string() })).min(2),
  /** Message activity within the analysis window. Pass [] to use demo seed data. */
  messages: z.array(teamMessageSchema).default([]),
  /** How many days back to analyse (default 7). */
  windowDays: z.number().int().min(1).max(30).default(7),
  thresholds: z
    .object({
      /** Member share below this % triggers a flag (default 15). */
      minSharePercent: z.number().min(0).max(100).default(15),
      /** Days without a message triggers a flag (default 3). */
      silenceDays: z.number().min(0).max(30).default(3)
    })
    .default({})
});

export const aiCoachingResponseSchema = z.object({
  teamId: z.string(),
  hasAlert: z.boolean(),
  alerts: z.array(
    z.object({
      flaggedMember: z.string(),
      memberId: z.string(),
      reason: z.string().min(10),
      suggestedFollowUp: z.string().min(10),
      severity: z.enum(["low", "medium", "high"]),
      participationShare: z.number().min(0).max(100),
      daysSilent: z.number().min(0)
    })
  ),
  participationSummary: z.array(
    z.object({
      memberName: z.string(),
      messageCount: z.number().int(),
      sharePercent: z.number().min(0).max(100),
      lastActiveAt: z.string()
    })
  )
});

export type AICoachingRequest = z.infer<typeof aiCoachingRequestSchema>;
export type AICoachingResponse = z.infer<typeof aiCoachingResponseSchema>;
