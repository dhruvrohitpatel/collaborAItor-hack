import type { AICharterResponse, AIProfileResponse } from "@/lib/ai/schemas";
import type { StudentIntake, Team } from "@/types/domain";

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
    profileSource: "mock"
  };
}

export async function generateMockRationale(team: Team): Promise<string> {
  const strengthMix = new Set(team.members.flatMap((member) => member.strengths));
  const growthThemes = new Set(team.members.flatMap((member) => member.growthAreas));

  return `Team ${team.id} combines ${strengthMix.size} distinct strengths with complementary growth goals in ${Array.from(growthThemes)
    .slice(0, 2)
    .join(" and ")}. The grouping favors overlap in working windows while balancing communication styles and leadership signals.`;
}

export async function generateMockCharter(
  teamName: string,
  memberNames: string[]
): Promise<AICharterResponse> {
  return {
    charter: `${teamName} agrees to deliver work in weekly milestones, surface blockers within 24 hours, and document decisions in a shared note. Members (${memberNames.join(", ")}) commit to respectful feedback and rotating facilitation duties.`,
    suggestedRoleRotation: [
      "Week 1: Facilitator",
      "Week 2: Project Tracker",
      "Week 3: QA/Reviewer",
      "Week 4: Demo Lead"
    ],
    kickoffChecklist: [
      "Align project scope and definition of done",
      "Set recurring meeting cadence",
      "Assign first-week tasks and owners",
      "Decide communication channel norms"
    ]
  };
}

export async function summarizeMeetingNotes(notes: string) {
  const condensed = notes.split("\n").filter(Boolean).slice(0, 2).join(" ");
  return {
    summary: condensed || "Team reviewed goals, blockers, and immediate next steps.",
    actionItems: [
      "Document open decisions in project tracker",
      "Assign owners for next milestone deliverables",
      "Schedule mid-week async check-in"
    ],
    ownersNeeded: ["Facilitator", "Tracker", "Reviewer"]
  };
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
