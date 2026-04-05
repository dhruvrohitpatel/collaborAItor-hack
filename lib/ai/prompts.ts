import type { AICharterRequest, AIGenerateTeamsRationaleRequest } from "@/lib/ai/schemas";
import type { DisengagementCandidate } from "@/lib/ai/participation";
import type { ParticipationSignal } from "@/types/domain";
import type { StudentIntake } from "@/types/domain";

function formatOptionalList(label: string, values: string[] | undefined) {
  if (!values?.length) {
    return null;
  }

  return `${label}: ${values.join(", ")}`;
}

export function buildProfilePrompt(student: StudentIntake) {
  const questionnaireLines = [
    student.questionnaire?.classPriority
      ? `Class priority: ${student.questionnaire.classPriority}`
      : null,
    student.questionnaire?.weeklyCapacityHours !== undefined
      ? `Weekly capacity hours: ${student.questionnaire.weeklyCapacityHours}`
      : null,
    student.questionnaire?.externalCommitments
      ? `External commitments: ${student.questionnaire.externalCommitments}`
      : null,
    student.questionnaire?.scheduleConfidence
      ? `Schedule confidence: ${student.questionnaire.scheduleConfidence}`
      : null,
    student.questionnaire?.academicConfidence
      ? `Academic confidence: ${student.questionnaire.academicConfidence}`
      : null,
    formatOptionalList("Prior experience", student.questionnaire?.priorExperience),
    formatOptionalList("Communication habits", student.questionnaire?.communicationHabits),
    student.questionnaire?.leadershipPreference
      ? `Leadership preference: ${student.questionnaire.leadershipPreference}`
      : null,
    formatOptionalList(
      "Collaboration style preferences",
      student.questionnaire?.collaborationStylePreferences
    ),
    formatOptionalList("Class goals", student.questionnaire?.classGoals),
    student.questionnaire?.openReflection
      ? `Questionnaire reflection: ${student.questionnaire.openReflection}`
      : null
  ].filter((line): line is string => Boolean(line));

  const rosterLines = [
    student.roster?.section ? `Section: ${student.roster.section}` : null,
    student.roster?.cohort ? `Cohort: ${student.roster.cohort}` : null
  ].filter((line): line is string => Boolean(line));

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
    "- If questionnaire data is present, prioritize it as the richer source of collaboration signal.",
    "- Treat roster metadata as context only; it should not dominate the profile.",
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
    `Short reflection: ${student.shortReflection}`,
    "",
    "Roster metadata:",
    ...(rosterLines.length ? rosterLines : ["None provided"]),
    "",
    "Questionnaire data:",
    ...(questionnaireLines.length ? questionnaireLines : ["None provided"])
  ].join("\n");
}

export function buildBatchProfilePrompt(students: StudentIntake[]) {
  const serializedStudents = students.map((student) => ({
    studentId: student.id,
    name: student.name,
    timezone: student.timezone,
    availability: student.availability.map((slot) => `${slot.day} ${slot.start}-${slot.end}`),
    strengths: student.strengths,
    growthAreas: student.growthAreas,
    preferredRole: student.preferredRole,
    communicationStyle: student.communicationStyle,
    collaborationPreferences: student.collaborationPreferences,
    shortReflection: student.shortReflection
  }));

  return [
    "You are a neutral collaboration profiler for an academic team-formation tool.",
    "Analyze every student intake record below and return ONLY a single JSON object.",
    "Do not use markdown. Do not omit any students. Do not add commentary.",
    "",
    "Required JSON shape:",
    "{",
    '  "profiles": [',
    "    {",
    '      "studentId": "<must exactly match an input studentId>",',
    '      "profileSummary": "<2-3 sentence neutral description of collaboration style and role fit>",',
    '      "inferredTags": ["<tag1>", "<tag2>", "..."],',
    '      "leadershipSignal": "<high | medium | emerging>",',
    '      "riskFlags": [',
    '        { "code": "<snake_case_id>", "label": "<short label>", "severity": "<low | medium | high>", "note": "<one sentence>" }',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Rules:",
    "- Return exactly one profile object for every input student.",
    "- studentId must be copied exactly from the input roster.",
    "- inferredTags: 3-5 lowercase tags derived from strengths, style, and role.",
    "- leadershipSignal: high if preferred role or style suggests facilitation/leadership; emerging if limited signals; otherwise medium.",
    "- riskFlags: flag genuine collaboration risks only. Use an empty array if none.",
    "- Do NOT include email or any other PII in output fields.",
    "- Be descriptive and neutral.",
    "",
    "Student roster:",
    JSON.stringify(serializedStudents, null, 2)
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

export function buildCharterPrompt(payload: AICharterRequest) {
  const { teamName, memberNames, projectTheme, communicationStyles, riskFlags } = payload;

  const stylesLine =
    communicationStyles.length > 0
      ? communicationStyles.join(", ")
      : "not specified";

  const flagLines =
    riskFlags.length > 0
      ? riskFlags.map((f) => `  - ${f.label} (${f.severity})`).join("\n")
      : "  None";

  const roles = ["Facilitator", "Project Tracker", "QA/Reviewer", "Demo Lead", "Scribe"];
  const rotationExample = memberNames
    .slice(0, 4)
    .map((name, i) => `"${name} — ${roles[i % roles.length]}"`)
    .join(", ");

  return [
    "You are writing a team charter for an academic project team.",
    "Return ONLY a JSON object — no markdown, no preamble.",
    "",
    "Required JSON shape:",
    "{",
    '  "charter": "<2-3 sentences of specific norms, communication cadence, accountability>",',
    '  "suggestedRoleRotation": [' + rotationExample + ", ...],",
    '  "kickoffChecklist": ["<actionable verb phrase>", ...]',
    "}",
    "",
    "Rules:",
    "- charter: 2-3 sentences. Reference the team's communication style(s) to set concrete norms.",
    "  Include a check-in cadence (e.g. async weekly update + 30-min sync). End with an",
    "  accountability norm that addresses any high/medium risk flags if present.",
    "- suggestedRoleRotation: one entry per member, each a distinct role from:",
    `  Facilitator, Project Tracker, QA/Reviewer, Demo Lead, Scribe.`,
    "- kickoffChecklist: 4-5 actionable items specific to this team.",
    "  Reference risk flags if present. Format: verb phrase (e.g. 'Confirm async update channel').",
    "- Do NOT use filler phrases like 'your team', 'feel free', or 'as needed'.",
    "",
    `Team: ${teamName}`,
    `Members (${memberNames.length}): ${memberNames.join(", ")}`,
    `Project theme: ${projectTheme}`,
    `Communication styles: ${stylesLine}`,
    "Active risk flags:",
    flagLines
  ].join("\n");
}

export function buildMeetingSummaryPrompt(notes: string) {
  return [
    "You are extracting structured output from raw academic team meeting notes.",
    "Return ONLY a JSON object — no markdown, no preamble.",
    "",
    "Required JSON shape:",
    "{",
    '  "summary": "<2-3 sentence summary of what was discussed and decided>",',
    '  "actionItems": [{ "task": "<verb phrase>", "owner": "<name or empty string>" }],',
    '  "openQuestions": ["<unresolved question>"]',
    "}",
    "",
    "Rules:",
    "- summary: 2-3 sentences covering key decisions and overall progress. No bullet points.",
    "- actionItems: one object per concrete next step. Extract owner from context",
    '  (e.g. "Alex will fix the bug" → owner: "Alex"). Use "" if no owner is mentioned.',
    "  Format task as a verb phrase (e.g. 'Fix auth token refresh flow').",
    "- openQuestions: questions raised but not resolved. Empty array if none.",
    "- Extract from the notes faithfully — do not invent tasks or owners.",
    "",
    "Meeting notes:",
    notes
  ].join("\n");
}

export function buildCoachingPrompt(
  teamId: string,
  signals: ParticipationSignal[],
  candidates: DisengagementCandidate[]
) {
  const summaryLines = signals
    .map((s) => `  ${s.memberName}: ${s.sharePercent}% share, ${s.messageCount} messages, last active ${s.daysSilent === 0 ? "today" : `${s.daysSilent}d ago`}`)
    .join("\n");

  const flagLines = candidates
    .map((c) => `  ${c.signal.memberName}: ${c.reasons.join("; ")} → tentative severity: ${c.severity}`)
    .join("\n");

  return [
    "You are a proactive coaching assistant for an academic instructor.",
    "Generate instructor-facing disengagement alerts based on participation data.",
    "Return ONLY a JSON object — no markdown, no preamble.",
    "",
    "Required JSON shape:",
    "{",
    '  "alerts": [',
    '    {',
    '      "flaggedMember": "<name>",',
    '      "memberId": "<id>",',
    '      "reason": "<one sentence, non-judgmental, references specific numbers>",',
    '      "suggestedFollowUp": "<one concrete action the instructor can take>",',
    '      "severity": "<low | medium | high>"',
    '    }',
    "  ]",
    "}",
    "",
    "Rules:",
    "- One alert object per flagged member only. Empty array if no candidates.",
    "- reason: cite the specific signal (e.g. '7% of team messages and silent for 5 days').",
    "  Use 'may be' / 'appears to' — never state disengagement as fact.",
    "  Do NOT use the word 'disengaged' or make character judgements.",
    "- suggestedFollowUp: a direct, actionable step (e.g. 'Send a brief check-in message').",
    "- severity: use the tentative severity unless the data clearly warrants adjustment.",
    "- Keep each field to one sentence.",
    "",
    `Team: ${teamId}`,
    "Participation (last 7 days):",
    summaryLines,
    "",
    "Flagged for review:",
    flagLines.length > 0 ? flagLines : "  None"
  ].join("\n");
}

export function buildRewritePrompt(message: string, tone: string, audience: string) {
  const toneGuide: Record<string, string> = {
    polite: "warm and respectful — soften demands, acknowledge effort, avoid blame",
    direct: "clear and concise — remove filler words, lead with the ask, no hedging",
    encouraging: "positive and motivating — name progress, frame challenges as opportunities",
    professional: "neutral and formal — structured sentences, no colloquialisms, task-focused"
  };
  const guide = toneGuide[tone] ?? "clear and appropriate for a team context";

  return [
    "You are rewriting a team message to improve clarity and professionalism.",
    "Return ONLY a JSON object — no markdown, no preamble.",
    "",
    "Required JSON shape:",
    '{',
    '  "rewrittenMessage": "<rewritten message text>",',
    '  "notes": "<one sentence explaining the key rewrite decision>"',
    '}',
    "",
    "Rules:",
    `- Tone: ${tone} — ${guide}.`,
    `- Audience: ${audience}.`,
    "- Preserve the original intent exactly — do not add tasks, deadlines, or commitments not in the original.",
    "- rewrittenMessage: complete, ready-to-send text. No placeholders.",
    "- notes: one sentence naming the primary change (e.g. 'Replaced blame framing with shared ownership language.').",
    "- Do not start rewrittenMessage with 'I' if the original does not.",
    "",
    "Original message:",
    message
  ].join("\n");
}
