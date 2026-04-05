import { z } from "zod";

// ─── Sub-schemas ────────────────────────────────────────────────────────────

const StrengthAreaSchema = z.enum([
  "coding",
  "testing",
  "documentation",
  "coordination",
  "design",
]);

const CommunicationStyleSchema = z.enum([
  "direct",
  "structured",
  "flexible",
  "collaborative",
]);

const CollaborationPreferenceSchema = z.enum(["solo", "pair", "group"]);

const RiskFlagSchema = z.object({
  type: z.enum([
    "overcommitment",
    "conflict_avoidance",
    "low_execution_reliability",
    "high_stress_drift",
    "intent_action_gap",
    "disengagement_risk",
  ]),
  // plain-English note shown in instructor dashboard
  note: z.string().max(200),
  // how confident Gemini is in this flag (0.0 – 1.0)
  confidence: z.number().min(0).max(1),
});

// Mini-IPIP Big Five scores — deterministically computed from the 20-item
// questionnaire. Each dimension scored 1–5 (low → high).
const IPIPScoresSchema = z.object({
  openness: z.number().min(1).max(5),
  conscientiousness: z.number().min(1).max(5),
  extraversion: z.number().min(1).max(5),
  agreeableness: z.number().min(1).max(5),
  neuroticism: z.number().min(1).max(5),
});

// BTS signals inferred by Gemini from the reflection paragraph.
// Mirrors the 5 BTS dimensions from the research doc.
// In production these would be enriched by GitHub/LMS data.
// Each dimension scored 1–5.
const BTSSignalsSchema = z.object({
  interaction_dynamics: z.number().min(1).max(5),
  execution_reliability: z.number().min(1).max(5),
  cognitive_work_patterns: z.number().min(1).max(5),
  stress_and_drift_behavior: z.number().min(1).max(5),
  alignment: z.number().min(1).max(5),
});

// Fused signal: where IPIP and BTS agree, confidence is high.
// Where they diverge, confidence drops and a risk flag may be raised.
// OR-Tools uses fused_score + confidence as inputs, not raw IPIP/BTS.
const FusedDimensionSchema = z.object({
  dimension: z.string(),
  ipip_score: z.number().min(1).max(5),
  bts_score: z.number().min(1).max(5),
  fused_score: z.number().min(1).max(5),
  // high divergence (>1.5 gap) triggers a risk flag
  confidence: z.number().min(0).max(1),
});

// Emotion classifier output from HuggingFace
// (j-hartmann/emotion-english-distilroberta-base)
// run on the reflection paragraph before Gemini processing
const EmotionSignalSchema = z.object({
  dominant_emotion: z.enum([
    "neutral",
    "joy",
    "anger",
    "fear",
    "sadness",
    "surprise",
    "disgust",
  ]),
  // surfaces writing-under-pressure or conflict-avoidance tendencies
  tone_note: z.string().max(200),
});

// Availability windows — used as hard constraint in OR-Tools
const AvailabilitySchema = z.object({
  timezone: z.string(),
  weekly_hours_available: z.number().min(1).max(40),
  preferred_meeting_days: z.array(
    z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])
  ),
});

// ─── Root schema ─────────────────────────────────────────────────────────────

export const CollaborationProfileSchema = z.object({
  // identity
  student_id: z.string().uuid(),
  generated_at: z.string().datetime(),

  // intake signals
  strengths: z.array(StrengthAreaSchema).min(1).max(3),
  growth_targets: z.array(StrengthAreaSchema).min(1).max(2),
  collaboration_preference: CollaborationPreferenceSchema,
  communication_style: CommunicationStyleSchema,
  availability: AvailabilitySchema,

  // psychometric layer
  ipip_scores: IPIPScoresSchema,
  bts_signals: BTSSignalsSchema,
  fused_dimensions: z.array(FusedDimensionSchema).length(5),
  emotion_signal: EmotionSignalSchema,

  // Gemini-generated summary fields (shown in UI)
  summary: z.string().max(300),
  // descriptive only — not a permanent role assignment
  archetype_label: z.string().max(50),
  risk_flags: z.array(RiskFlagSchema).max(3),
});

// ─── Exported types ──────────────────────────────────────────────────────────

export type CollaborationProfile = z.infer<typeof CollaborationProfileSchema>;
export type RiskFlag = z.infer<typeof RiskFlagSchema>;
export type IPIPScores = z.infer<typeof IPIPScoresSchema>;
export type BTSSignals = z.infer<typeof BTSSignalsSchema>;
export type FusedDimension = z.infer<typeof FusedDimensionSchema>;

// ─── Example valid payload ───────────────────────────────────────────────────

export const EXAMPLE_PROFILE: CollaborationProfile = {
  student_id: "123e4567-e89b-12d3-a456-426614174000",
  generated_at: "2026-04-04T12:00:00Z",

  strengths: ["coding", "testing"],
  growth_targets: ["coordination"],
  collaboration_preference: "pair",
  communication_style: "direct",
  availability: {
    timezone: "America/Phoenix",
    weekly_hours_available: 10,
    preferred_meeting_days: ["tue", "thu"],
  },

  ipip_scores: {
    openness: 4.2,
    conscientiousness: 3.8,
    extraversion: 2.5,
    agreeableness: 3.9,
    neuroticism: 2.1,
  },

  bts_signals: {
    interaction_dynamics: 2.8,
    execution_reliability: 4.0,
    cognitive_work_patterns: 4.1,
    stress_and_drift_behavior: 2.0,
    alignment: 3.5,
  },

  fused_dimensions: [
    // extraversion vs interaction_dynamics — slight divergence, moderate confidence
    {
      dimension: "social_engagement",
      ipip_score: 2.5,
      bts_score: 2.8,
      fused_score: 2.65,
      confidence: 0.88,
    },
    {
      dimension: "execution_reliability",
      ipip_score: 3.8,
      bts_score: 4.0,
      fused_score: 3.9,
      confidence: 0.95,
    },
    {
      dimension: "cognitive_work_patterns",
      ipip_score: 4.2,
      bts_score: 4.1,
      fused_score: 4.15,
      confidence: 0.97,
    },
    {
      dimension: "stress_resilience",
      ipip_score: 2.1,
      bts_score: 2.0,
      fused_score: 2.05,
      confidence: 0.96,
    },
    {
      dimension: "alignment",
      ipip_score: 3.9,
      bts_score: 3.5,
      fused_score: 3.7,
      confidence: 0.82,
    },
  ],

  emotion_signal: {
    dominant_emotion: "neutral",
    tone_note: "Reflection is measured and task-focused with no distress signals.",
  },

  summary:
    "Strong individual contributor with deep coding and testing skills. Prefers structured pair work and is growing into coordination. Low social dominance — works well alongside high-extraversion teammates.",
  archetype_label: "Reliable Builder",
  risk_flags: [],
};