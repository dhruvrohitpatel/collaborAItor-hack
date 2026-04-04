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

export const aiSummarizeMeetingResponseSchema = z.object({
  summary: z.string(),
  actionItems: z.array(z.string()),
  ownersNeeded: z.array(z.string())
});

export const aiRewriteMessageRequestSchema = z.object({
  message: z.string().min(5),
  tone: z.enum(["polite", "direct", "encouraging", "professional"]),
  audience: z.string().min(2)
});

export const aiRewriteMessageResponseSchema = z.object({
  rewrittenMessage: z.string(),
  notes: z.string()
});

export type AIProfileRequest = z.infer<typeof aiProfileRequestSchema>;
export type AIProfileResponse = z.infer<typeof aiProfileResponseSchema>;
export type AIGenerateTeamsRationaleRequest = z.infer<typeof aiGenerateTeamsRationaleRequestSchema>;
export type AIGenerateTeamsRationaleResponse = z.infer<typeof aiGenerateTeamsRationaleResponseSchema>;
export type AICharterRequest = z.infer<typeof aiCharterRequestSchema>;
export type AICharterResponse = z.infer<typeof aiCharterResponseSchema>;
