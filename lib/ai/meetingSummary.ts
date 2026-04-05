import { callGeminiForJSON, getGeminiModel } from "@/lib/ai/gemini";
import { hasGeminiCredentials, summarizeMeetingNotes } from "@/lib/ai/mock";
import { buildMeetingSummaryPrompt } from "@/lib/ai/prompts";
import {
  aiSummarizeMeetingResponseSchema,
  type AIResponseMeta
} from "@/lib/ai/schemas";

function buildFallbackActionItem(notes: string) {
  const normalized = notes.replace(/\s+/g, " ").trim();
  const firstSentence = normalized
    .split(/[.!?]/)
    .map((value) => value.trim())
    .find(Boolean);

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

export async function generateMeetingSummary(notes: string) {
  const model = getGeminiModel();

  if (hasGeminiCredentials()) {
    try {
      const prompt = buildMeetingSummaryPrompt(notes);
      const raw = await callGeminiForJSON(prompt);
      const repaired = repairMeetingSummaryPayload(raw, notes);
      const validated = aiSummarizeMeetingResponseSchema.parse(repaired);

      return {
        data: validated,
        meta: {
          provider: "gemini",
          model,
          fallbackReason: null
        } satisfies AIResponseMeta
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[summarize-meeting] Gemini call failed: ${message}`);
      const mock = await summarizeMeetingNotes(notes);

      return {
        data: aiSummarizeMeetingResponseSchema.parse(mock),
        meta: {
          provider: "mock",
          model,
          fallbackReason: message
        } satisfies AIResponseMeta
      };
    }
  }

  const mock = await summarizeMeetingNotes(notes);
  return {
    data: aiSummarizeMeetingResponseSchema.parse(mock),
    meta: {
      provider: "mock",
      model,
      fallbackReason: "No Gemini credentials found."
    } satisfies AIResponseMeta
  };
}

export function buildMeetingSummaryAudioScript(input: {
  summary: string;
  actionItems: Array<{ task: string; owner: string }>;
  openQuestions: string[];
}) {
  const actionSection = input.actionItems
    .map(({ task, owner }, index) =>
      owner
        ? `Action item ${index + 1}. ${task}. Owner: ${owner}.`
        : `Action item ${index + 1}. ${task}.`
    )
    .join(" ");

  const nextSection =
    input.openQuestions.length > 0
      ? `Open questions for next steps: ${input.openQuestions.join(" ")}`
      : "There are no unresolved questions, so the next step is to complete the listed action items.";

  return [
    "Here is your meeting recap.",
    input.summary,
    actionSection,
    nextSection
  ].join(" ");
}
