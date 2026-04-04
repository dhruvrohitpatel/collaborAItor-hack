import type { StudentIntake, Team } from "@/types/domain";

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

export function buildTeamRationalePrompt(team: Team) {
  return [
    "Explain the team composition to an instructor in transparent language.",
    "Avoid deterministic claims about student outcomes.",
    `Team: ${team.id}`,
    `Members: ${team.members.map((member) => member.name).join(", ")}`,
    `Score: ${team.scoreSummary.total}`,
    `Risk flags: ${team.riskFlags.map((risk) => risk.label).join(", ") || "None"}`
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
