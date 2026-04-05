import { NextResponse } from "next/server";

import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { generateMockCoachingAlerts, hasGeminiCredentials } from "@/lib/ai/mock";
import { computeParticipation, detectDisengagement } from "@/lib/ai/participation";
import { buildCoachingPrompt } from "@/lib/ai/prompts";
import { aiCoachingRequestSchema, aiCoachingResponseSchema } from "@/lib/ai/schemas";
import { getSeedMessages } from "@/data/seedMessages";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = aiCoachingRequestSchema.parse(body);
  const model = getGeminiModel();

  const { teamId, members, windowDays, thresholds } = payload;

  // Use seed messages when no real activity data is provided (demo mode).
  const messages = payload.messages.length > 0
    ? payload.messages
    : getSeedMessages(teamId, members);

  const signals = computeParticipation(messages, members, windowDays);
  const candidates = detectDisengagement(signals, thresholds);

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildCoachingPrompt(teamId, signals, candidates);
      const raw = await callGeminiForJSON(prompt) as { alerts: unknown[] };

      // Gemini provides natural-language framing; merge with computed signal data.
      const geminiAlerts = Array.isArray(raw?.alerts) ? raw.alerts : [];
      const mergedAlerts = candidates.map((c, i) => {
        const gemini = geminiAlerts[i] as Record<string, unknown> | undefined;
        return {
          flaggedMember: c.signal.memberName,
          memberId: c.signal.memberId,
          reason: (typeof gemini?.reason === "string" && gemini.reason.length >= 10)
            ? gemini.reason
            : `${c.signal.memberName} appears to have reduced activity: ${c.reasons.join(" and ")}.`,
          suggestedFollowUp: (typeof gemini?.suggestedFollowUp === "string" && gemini.suggestedFollowUp.length >= 10)
            ? gemini.suggestedFollowUp
            : `Send ${c.signal.memberName} a brief check-in.`,
          severity: c.severity,
          participationShare: c.signal.sharePercent,
          daysSilent: c.signal.daysSilent
        };
      });

      const validated = aiCoachingResponseSchema.parse({
        teamId,
        hasAlert: mergedAlerts.length > 0,
        alerts: mergedAlerts,
        participationSummary: signals.map((s) => ({
          memberName: s.memberName,
          messageCount: s.messageCount,
          sharePercent: s.sharePercent,
          lastActiveAt: s.lastActiveAt
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
}
