import type { StudentIntake, Team } from "@/types/domain";

export function buildProfilePrompt(student: StudentIntake) {
  return [
    "You are creating a neutral collaboration profile for instructors.",
    "Be descriptive, not prescriptive.",
    `Student: ${student.name} (${student.email})`,
    `Strengths: ${student.strengths.join(", ")}`,
    `Growth areas: ${student.growthAreas.join(", ")}`,
    `Preferred role: ${student.preferredRole}`,
    `Communication style: ${student.communicationStyle}`,
    `Preferences: ${student.collaborationPreferences.join(", ")}`,
    `Reflection: ${student.shortReflection}`
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
