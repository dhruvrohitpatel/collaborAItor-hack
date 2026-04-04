import type { AICharterRequest, AICharterResponse, AIGenerateTeamsRationaleRequest, AIProfileResponse } from "@/lib/ai/schemas";
import type { StudentIntake } from "@/types/domain";

function scoreLevel(value: number): string {
  if (value >= 75) return "strong";
  if (value >= 50) return "moderate";
  return "limited";
}

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], seed: number) {
  return items[seed % items.length];
}

export function hasGeminiCredentials() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.VERTEX_PROJECT_ID);
}

export async function generateMockProfile(
  student: StudentIntake
): Promise<AIProfileResponse> {
  const seed = hashString(`${student.name}-${student.preferredRole}`);
  const leadershipSignal =
    student.preferredRole.toLowerCase().includes("lead") ||
    student.communicationStyle === "facilitative"
      ? "high"
      : seed % 2 === 0
        ? "medium"
        : "emerging";

  const framing = pick(
    [
      "Shows consistent ownership in scoped tasks and values clear handoffs.",
      "Brings steady execution energy and helps teams stay organized.",
      "Contributes thoughtful perspective and asks clarifying questions early."
    ],
    seed
  );

  return {
    profileSummary: `${student.name} is oriented toward ${student.preferredRole.toLowerCase()} contributions. ${framing}`,
    inferredTags: [
      ...student.strengths.slice(0, 2),
      student.communicationStyle,
      student.preferredRole
    ],
    leadershipSignal,
    riskFlags: [],
    profileSource: "mock"
  };
}

export async function generateMockRationale(
  payload: AIGenerateTeamsRationaleRequest
): Promise<string> {
  const { teamId, memberNames, scoreSummary, riskFlags } = payload;

  const skillLine = `${teamId} brings ${scoreLevel(scoreSummary.skillDiversity)} skill diversity across ${memberNames.length} members`;
  const availLine = `availability overlap is ${scoreLevel(scoreSummary.availabilityOverlap)}`;
  const balanceLine = `communication and leadership balance is ${scoreLevel(scoreSummary.communicationBalance)}`;

  const flagLine =
    riskFlags.length > 0
      ? ` One area to watch: ${riskFlags[0].label.toLowerCase()}.`
      : " No critical coordination risks were flagged.";

  return `${skillLine}, with ${availLine} and ${balanceLine}. Growth opportunity fit is ${scoreLevel(scoreSummary.growthOpportunityFit)}, suggesting members can learn meaningfully from each other.${flagLine}`;
}

export async function generateMockCharter(
  payload: AICharterRequest
): Promise<AICharterResponse> {
  const { teamName, memberNames, projectTheme, communicationStyles, riskFlags } = payload;

  const styleNote =
    communicationStyles.length > 0
      ? `a ${[...new Set(communicationStyles)].join("/")} communication dynamic`
      : "mixed communication styles";

  const riskNote =
    riskFlags.some((f) => f.severity === "high" || f.severity === "medium")
      ? ` Given ${riskFlags[0].label.toLowerCase()}, members commit to surfacing blockers within 24 hours.`
      : " Members commit to surfacing blockers within 24 hours.";

  const roles = ["Facilitator", "Project Tracker", "QA/Reviewer", "Demo Lead", "Scribe"];

  return {
    charter:
      `${teamName} operates with ${styleNote} and delivers work in weekly milestones tied to the ${projectTheme} scope.` +
      ` A standing async update is posted by end of each Monday; a 30-minute sync is held mid-week for blockers only.` +
      riskNote,
    suggestedRoleRotation: memberNames.map(
      (name, i) => `${name} — ${roles[i % roles.length]}`
    ),
    kickoffChecklist: [
      `Agree on the primary async channel for ${projectTheme} updates`,
      "Define milestone owners and delivery format for week one",
      "Set the quality bar and review checklist before first submission",
      "Schedule the mid-week sync and confirm attendance expectations",
      ...(riskFlags.some((f) => f.severity === "high")
        ? [`Address "${riskFlags.find((f) => f.severity === "high")!.label}" before sprint start`]
        : [])
    ]
  };
}

export async function summarizeMeetingNotes(notes: string) {
  const lines = notes.split("\n").map((l) => l.trim()).filter(Boolean);

  // Summary: first two substantive lines joined into a sentence.
  const summaryBase = lines.slice(0, 3).join(" ").replace(/\s+/g, " ");
  const summary = summaryBase.length >= 10
    ? summaryBase.endsWith(".") ? summaryBase : `${summaryBase}.`
    : "Team reviewed progress, surfaced blockers, and identified next steps.";

  // Action items: lines containing action keywords; extract trailing owner hint.
  const actionKeywords = /\b(will|should|needs? to|must|action:|todo:|follow.?up|assign|complete|finish|update|fix|send|schedule|confirm|review|prepare)\b/i;
  const ownerPattern = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(will|should|needs? to|must)\b/i;

  const extracted = lines
    .filter((line) => actionKeywords.test(line))
    .slice(0, 5)
    .map((line) => {
      const ownerMatch = line.match(ownerPattern);
      const owner = ownerMatch ? ownerMatch[1] : "";
      // Strip leading name + verb from task description.
      const task = ownerMatch
        ? line.replace(ownerPattern, "").trim()
        : line.replace(/^[-*•]\s*/, "").replace(/^(action:|todo:)\s*/i, "");
      return { task: task.charAt(0).toUpperCase() + task.slice(1), owner };
    });

  const actionItems =
    extracted.length > 0
      ? extracted
      : [
          { task: "Document open decisions in shared project notes", owner: "" },
          { task: "Assign owners for next milestone deliverables", owner: "" },
          { task: "Schedule mid-week async check-in", owner: "" }
        ];

  // Open questions: lines ending with "?" or containing "question" / "unclear".
  const openQuestions = lines
    .filter((line) => line.endsWith("?") || /\b(question|unclear|TBD|who|when|which)\b/i.test(line))
    .slice(0, 3)
    .map((line) => line.replace(/^[-*•]\s*/, ""));

  return { summary, actionItems, openQuestions };
}

export async function rewriteMessage(
  message: string,
  tone: "polite" | "direct" | "encouraging" | "professional",
  audience: string
) {
  const tonePrefix: Record<typeof tone, string> = {
    polite: "Hi team,",
    direct: "Team,",
    encouraging: "Hi everyone, great progress so far.",
    professional: "Hello team,"
  };

  return {
    rewrittenMessage: `${tonePrefix[tone]} For ${audience}, here is a clearer version: ${message.trim()} Please confirm alignment by end of day.`,
    notes: "Mock rewrite used. Connect Gemini for nuanced tone adaptation."
  };
}
