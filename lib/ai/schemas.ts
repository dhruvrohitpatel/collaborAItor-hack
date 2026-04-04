import { z } from "zod";

import { studentIntakeSchema } from "@/lib/schemas";

export const aiProfileRequestSchema = z.object({
  student: studentIntakeSchema
});

export const aiProfileResponseSchema = z.object({
  profileSummary: z.string(),
  inferredTags: z.array(z.string()),
  leadershipSignal: z.enum(["high", "medium", "emerging"]),
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
  teamName: z.string(),
  memberNames: z.array(z.string()).min(1),
  projectTheme: z.string().default("Course project")
});

export const aiCharterResponseSchema = z.object({
  charter: z.string(),
  suggestedRoleRotation: z.array(z.string()),
  kickoffChecklist: z.array(z.string())
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
export type AICharterRequest = z.infer<typeof aiCharterRequestSchema>;
export type AICharterResponse = z.infer<typeof aiCharterResponseSchema>;
