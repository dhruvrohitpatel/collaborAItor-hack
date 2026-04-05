import { z } from "zod";

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

export const teamSchema = z.object({
  id: z.string().min(1),
  members: z.array(collaborationProfileSchema),
  rationale: z.string().min(1),
  riskFlags: z.array(riskFlagSchema),
  scoreSummary: teamScoreBreakdownSchema,
  support: teamSupportArtifactsSchema
});

export const generateTeamsInputSchema = z.object({
  teamSize: z.number().int().min(2).max(6).default(4)
});

export type StudentIntakeInput = z.infer<typeof studentIntakeSchema>;
export type GenerateTeamsInput = z.infer<typeof generateTeamsInputSchema>;
export type RiskFlagInput = z.infer<typeof riskFlagSchema>;
export type CollaborationProfile = z.infer<typeof collaborationProfileSchema>;
