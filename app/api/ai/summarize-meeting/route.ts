import { NextResponse } from "next/server";

import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { hasGeminiCredentials, summarizeMeetingNotes } from "@/lib/ai/mock";
import { buildMeetingSummaryPrompt } from "@/lib/ai/prompts";
import {
  aiSummarizeMeetingRequestSchema,
  aiSummarizeMeetingResponseSchema
} from "@/lib/ai/schemas";

function buildFallbackActionItem(notes: string) {
  const normalized = notes.replace(/\s+/g, " ").trim();
  const firstSentence = normalized.split(/[.!?]/).map((value) => value.trim()).find(Boolean);

  if (firstSentence && firstSentence.length >= 12) {
    return {
      task: `Capture follow-up decisions from: ${firstSentence}`,
      owner: ""
    };
  }

  return {
    task: "Document open decisions and assign next-step owners",
    owner: ""
  };
}

function repairMeetingSummaryPayload(raw: unknown, notes: string) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const candidate = raw as {
    summary?: unknown;
    actionItems?: unknown;
    openQuestions?: unknown;
  };

  const actionItems = Array.isArray(candidate.actionItems)
    ? candidate.actionItems.filter(
        (item): item is { task?: unknown; owner?: unknown } =>
          Boolean(item) && typeof item === "object"
      )
    : [];

  if (actionItems.length > 0) {
    return raw;
  }

  return {
    ...candidate,
    actionItems: [buildFallbackActionItem(notes)]
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { notes } = aiSummarizeMeetingRequestSchema.parse(body);
  const model = getGeminiModel();

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildMeetingSummaryPrompt(notes);
      const raw = await callGeminiForJSON(prompt);
      const repaired = repairMeetingSummaryPayload(raw, notes);

      const validated = aiSummarizeMeetingResponseSchema.parse(repaired);
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
      console.error(`[summarize-meeting] Gemini call failed: ${message}`);
      const mock = await summarizeMeetingNotes(notes);
      return NextResponse.json({
        ...aiSummarizeMeetingResponseSchema.parse(mock),
        meta: {
          provider: "mock",
          model,
          fallbackReason: message
        }
      });
    }
  }

  const mock = await summarizeMeetingNotes(notes);
  return NextResponse.json({
    ...aiSummarizeMeetingResponseSchema.parse(mock),
    meta: {
      provider: "mock",
      model,
      fallbackReason: "No Gemini credentials found."
    }
  });
}
