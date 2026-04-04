import type { AIGenerateTeamsRationaleRequest } from "@/lib/ai/schemas";
import type { StudentIntake } from "@/types/domain";

export function buildProfilePrompt(student: StudentIntake) {
  return [
    "You are a neutral collaboration profiler for an academic team-formation tool.",
    "Analyze the student intake data below and return ONLY a JSON object — no markdown, no explanation.",
    "",
    "Required JSON shape:",
    '{',
    '  "profileSummary": "<2-3 sentence neutral description of collaboration style and role fit>",',
    '  "inferredTags": ["<tag1>", "<tag2>", "..."],',
    '  "leadershipSignal": "<high | medium | emerging>",',
    '  "riskFlags": [',
    '    { "code": "<snake_case_id>", "label": "<short label>", "severity": "<low | medium | high>", "note": "<one sentence>" }',
    '  ]',
    '}',
    "",
    "Rules:",
    "- inferredTags: 3-5 lowercase tags derived from strengths, style, and role (e.g. async-first, detail-oriented).",
    "- leadershipSignal: high if preferred role or style suggests facilitation/leadership; emerging if limited signals; otherwise medium.",
    "- riskFlags: flag genuine collaboration risks only (e.g. single-style dominance, very limited availability, narrow skill set). Empty array if none.",
    "- Do NOT include the student's email or any PII in any field.",
    "- Be descriptive and neutral — no value judgements.",
    "",
    "Student intake:",
    `Name: ${student.name}`,
    `Timezone: ${student.timezone}`,
    `Availability: ${student.availability.map((s) => `${s.day} ${s.start}-${s.end}`).join(", ")}`,
    `Strengths: ${student.strengths.join(", ")}`,
    `Growth areas: ${student.growthAreas.join(", ")}`,
    `Preferred role: ${student.preferredRole}`,
    `Communication style: ${student.communicationStyle}`,
    `Collaboration preferences: ${student.collaborationPreferences.join(", ")}`,
    `Short reflection: ${student.shortReflection}`
  ].join("\n");
}

function scoreLevel(value: number): string {
  if (value >= 75) return "strong";
  if (value >= 50) return "moderate";
  return "limited";
}

export function buildTeamRationalePrompt(payload: AIGenerateTeamsRationaleRequest) {
  const { teamId, memberNames, scoreSummary, riskFlags } = payload;

  const flagLines =
    riskFlags.length > 0
      ? riskFlags.map((f) => `  - ${f.label} (${f.severity})`).join("\n")
      : "  None";

  return [
    "You are writing a brief team-composition rationale for an academic instructor.",
    "Return ONLY a JSON object — no markdown, no preamble.",
    "",
    'Required JSON shape: { "rationale": "<text>" }',
    "",
    "Rules:",
    "- 2-4 sentences. Plain language an instructor can read aloud to judges.",
    "- Reference the key factors: skill mix, availability overlap, communication/leadership balance, and any risk flags.",
    "- Use the score levels (strong / moderate / limited) as described, not raw numbers.",
    "- Mention active risk flags by name and suggest one brief mitigation if severity is high.",
    "- Do not name individual students. Do not make deterministic outcome claims.",
    "- Vary sentence structure — avoid starting every sentence the same way.",
    "",
    `Team: ${teamId}`,
    `Members (${memberNames.length}): ${memberNames.join(", ")}`,
    "",
    "Score levels:",
    `  Skill diversity:          ${scoreLevel(scoreSummary.skillDiversity)} (${Math.round(scoreSummary.skillDiversity)})`,
    `  Availability overlap:     ${scoreLevel(scoreSummary.availabilityOverlap)} (${Math.round(scoreSummary.availabilityOverlap)})`,
    `  Communication balance:    ${scoreLevel(scoreSummary.communicationBalance)} (${Math.round(scoreSummary.communicationBalance)})`,
    `  Leadership distribution:  ${scoreLevel(scoreSummary.leadershipDistribution)} (${Math.round(scoreSummary.leadershipDistribution)})`,
    `  Growth opportunity fit:   ${scoreLevel(scoreSummary.growthOpportunityFit)} (${Math.round(scoreSummary.growthOpportunityFit)})`,
    `  Overall score:            ${Math.round(scoreSummary.total)}`,
    "",
    "Active risk flags:",
    flagLines
  ].join("\n");
}

export function buildCharterPrompt(
  teamName: string,
  memberNames: string[],
  projectTheme: string
) {
  return [
    "Draft a concise student team charter.",
    `Team: ${teamName}`,
    `Members: ${memberNames.join(", ")}`,
    `Project theme: ${projectTheme}`,
    "Include norms, communication cadence, and accountability language."
  ].join("\n");
}

export function buildMeetingSummaryPrompt(notes: string) {
  return [
    "Summarize meeting notes into action-oriented outputs.",
    "Return: short summary, concrete action items, and owners needed.",
    "Meeting notes:",
    notes
  ].join("\n");
}

export function buildRewritePrompt(message: string, tone: string, audience: string) {
  return [
    "Rewrite this message for professional team communication.",
    `Audience: ${audience}`,
    `Tone: ${tone}`,
    "Message:",
    message
  ].join("\n");
}
