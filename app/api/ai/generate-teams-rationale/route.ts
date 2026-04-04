import { NextResponse } from "next/server";

import { buildTeamRationalePrompt } from "@/lib/ai/prompts";
import {
  aiGenerateTeamsRationaleRequestSchema,
  aiGenerateTeamsRationaleResponseSchema
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiGenerateTeamsRationaleRequestSchema.parse(body);

  const prompt = buildTeamRationalePrompt({
    id: payload.teamId,
    members: payload.memberNames.map((name, index) => ({
      id: `member-${index}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.edu`,
      timezone: "UTC",
      availability: [{ day: "Mon", start: "10:00", end: "11:00" }],
      strengths: ["collaboration"],
      growthAreas: ["planning"],
      preferredRole: "Contributor",
      communicationStyle: "collaborative",
      collaborationPreferences: ["shared docs"],
      shortReflection: "Mock rationale member",
      profileSummary: "Mock",
      inferredTags: ["mock"],
      leadershipSignal: "medium",
      profileSource: "mock",
      profileGeneratedAt: new Date().toISOString()
    })),
    rationale: "",
    riskFlags: payload.riskFlags.map((risk) => ({
      code: risk.label,
      label: risk.label,
      severity: risk.severity,
      note: "Flag generated from scoring heuristics"
    })),
    scoreSummary: payload.scoreSummary,
    support: {
      charter: "",
      suggestedRoleRotation: [],
      kickoffChecklist: []
    }
  });

  // TODO: Inject Gemini generation here when credentials are available.
  const rationale = `${payload.teamId}: balanced composition for ${payload.memberNames.join(
    ", "
  )}. Team score ${payload.scoreSummary.total} with risk focus on ${payload.riskFlags.map((flag) => flag.label).join(", ") || "none"}.`;

  void prompt;

  return NextResponse.json(
    aiGenerateTeamsRationaleResponseSchema.parse({
      rationale
    })
  );
}
