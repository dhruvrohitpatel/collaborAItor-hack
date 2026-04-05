import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authErrorResponse, requireApiTeamAccess } from "@/lib/auth/guards";
import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { generateMockCoachingAlerts, hasGeminiCredentials } from "@/lib/ai/mock";
import { computeParticipation, detectDisengagement } from "@/lib/ai/participation";
import { buildCoachingPrompt } from "@/lib/ai/prompts";
import { aiCoachingRequestSchema, aiCoachingResponseSchema } from "@/lib/ai/schemas";
import { getSeedMessages } from "@/data/seedMessages";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = aiCoachingRequestSchema.parse(body);
    await requireApiTeamAccess(payload.teamId);
    const model = getGeminiModel();

    const { teamId, members, windowDays, thresholds } = payload;

    const messages =
      payload.messages.length > 0 ? payload.messages : getSeedMessages(teamId, members);

    const signals = computeParticipation(messages, members, windowDays);
    const candidates = detectDisengagement(signals, thresholds);

    if (hasGeminiCredentials()) {
      try {
        const prompt = buildCoachingPrompt(teamId, signals, candidates);
        const raw = (await callGeminiForJSON(prompt)) as { alerts: unknown[] };

        const geminiAlerts = Array.isArray(raw?.alerts) ? raw.alerts : [];
        const mergedAlerts = candidates.map((candidate, index) => {
          const gemini = geminiAlerts[index] as Record<string, unknown> | undefined;
          return {
            flaggedMember: candidate.signal.memberName,
            memberId: candidate.signal.memberId,
            reason:
              typeof gemini?.reason === "string" && gemini.reason.length >= 10
                ? gemini.reason
                : `${candidate.signal.memberName} appears to have reduced activity: ${candidate.reasons.join(" and ")}.`,
            suggestedFollowUp:
              typeof gemini?.suggestedFollowUp === "string" &&
              gemini.suggestedFollowUp.length >= 10
                ? gemini.suggestedFollowUp
                : `Send ${candidate.signal.memberName} a brief check-in.`,
            severity: candidate.severity,
            participationShare: candidate.signal.sharePercent,
            daysSilent: candidate.signal.daysSilent
          };
        });

        const validated = aiCoachingResponseSchema.parse({
          teamId,
          hasAlert: mergedAlerts.length > 0,
          alerts: mergedAlerts,
          participationSummary: signals.map((signal) => ({
            memberName: signal.memberName,
            messageCount: signal.messageCount,
            sharePercent: signal.sharePercent,
            lastActiveAt: signal.lastActiveAt
          }))
        });
        return NextResponse.json({
          ...validated,
          meta: {
            provider: "gemini",
            model,
            fallbackReason: null
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[coaching] Gemini call failed for ${teamId}: ${message}`);
        const mock = generateMockCoachingAlerts(teamId, signals, candidates);
        return NextResponse.json({
          ...aiCoachingResponseSchema.parse(mock),
          meta: {
            provider: "mock",
            model,
            fallbackReason: message
          }
        });
      }
    }

    const mock = generateMockCoachingAlerts(teamId, signals, candidates);
    return NextResponse.json({
      ...aiCoachingResponseSchema.parse(mock),
      meta: {
        provider: "mock",
        model,
        fallbackReason: "No Gemini credentials found."
      }
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
