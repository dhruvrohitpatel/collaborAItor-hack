import { summarizeMeetingNotes } from "../lib/ai/mock";
import { buildMeetingSummaryPrompt } from "../lib/ai/prompts";
import {
  aiSummarizeMeetingRequestSchema,
  aiSummarizeMeetingResponseSchema
} from "../lib/ai/schemas";

let passed = 0;
let failed = 0;

function assert(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${label}\n    ${e.message}`);
    failed++;
  }
}

const richNotes = `
Reviewed sprint progress — integration tests are passing but the auth token refresh is still broken.
Alex will fix the auth token refresh flow by Wednesday.
Sam should update the README with the new setup steps.
Jordan needs to schedule a demo run-through before Friday.
Who is handling the deployment to staging?
Which environment should the integration tests run against?
Morgan mentioned the API rate limit might be an issue TBD.
`.trim();

const sparseNotes = `Quick sync. Things seem on track. No major issues.`;

const ownerlessNotes = `Need to finish the slides. Should review the data pipeline output. Must update the test fixtures.`;

async function main() {
  console.log("\n── aiSummarizeMeetingRequestSchema ──");

  assert("accepts valid notes", () => {
    aiSummarizeMeetingRequestSchema.parse({ notes: richNotes });
  });
  assert("rejects notes shorter than 10 chars", () => {
    const result = aiSummarizeMeetingRequestSchema.safeParse({ notes: "hi" });
    if (result.success) throw new Error("should have rejected");
  });

  console.log("\n── buildMeetingSummaryPrompt ──");

  const prompt = buildMeetingSummaryPrompt(richNotes);

  assert("prompt includes the notes verbatim", () => {
    if (!prompt.includes("auth token refresh")) throw new Error("notes content missing");
  });
  assert("prompt requests JSON with all three fields", () => {
    if (!prompt.includes('"summary"') || !prompt.includes('"actionItems"') || !prompt.includes('"openQuestions"'))
      throw new Error("JSON shape spec missing");
  });
  assert("prompt specifies task+owner structure", () => {
    if (!prompt.includes('"task"') || !prompt.includes('"owner"'))
      throw new Error("action item shape missing");
  });
  assert("prompt instructs verb-phrase format for tasks", () => {
    if (!prompt.includes("verb phrase")) throw new Error("verb phrase instruction missing");
  });

  console.log("\n── summarizeMeetingNotes (mock) ──");

  const result = await summarizeMeetingNotes(richNotes);

  assert("summary is non-empty string ≥ 10 chars", () => {
    if (!result.summary || result.summary.length < 10) throw new Error("summary too short");
  });
  assert("actionItems is a non-empty array", () => {
    if (!Array.isArray(result.actionItems) || result.actionItems.length === 0)
      throw new Error("empty actionItems");
  });
  assert("each action item has task and owner fields", () => {
    for (const item of result.actionItems) {
      if (typeof item.task !== "string" || typeof item.owner !== "string")
        throw new Error(`malformed item: ${JSON.stringify(item)}`);
    }
  });
  assert("extracts owner from 'Alex will...' pattern", () => {
    const alexItem = result.actionItems.find((item) => item.owner === "Alex");
    if (!alexItem) throw new Error("Alex not extracted as owner");
  });
  assert("extracts owner from 'Sam should...' pattern", () => {
    const samItem = result.actionItems.find((item) => item.owner === "Sam");
    if (!samItem) throw new Error("Sam not extracted as owner");
  });
  assert("openQuestions captures lines ending with '?'", () => {
    if (!Array.isArray(result.openQuestions)) throw new Error("openQuestions missing");
    const hasQuestion = result.openQuestions.some((q) => q.includes("environment") || q.includes("handling") || q.includes("staging"));
    if (!hasQuestion) throw new Error(`no deployment question found — got: ${JSON.stringify(result.openQuestions)}`);
  });

  const sparseResult = await summarizeMeetingNotes(sparseNotes);
  assert("sparse notes: falls back to default action items", () => {
    if (sparseResult.actionItems.length === 0) throw new Error("no fallback items");
  });
  assert("sparse notes: summary is non-empty", () => {
    if (!sparseResult.summary || sparseResult.summary.length < 10) throw new Error("empty summary");
  });

  const ownerlessResult = await summarizeMeetingNotes(ownerlessNotes);
  assert("ownerless notes: all owners are empty string", () => {
    for (const item of ownerlessResult.actionItems) {
      if (item.owner !== "") throw new Error(`unexpected owner: "${item.owner}"`);
    }
  });

  console.log("\n── aiSummarizeMeetingResponseSchema ──");

  assert("rich mock output passes schema", () => {
    aiSummarizeMeetingResponseSchema.parse(result);
  });
  assert("rejects summary shorter than 10 chars", () => {
    const r = aiSummarizeMeetingResponseSchema.safeParse({ ...result, summary: "Too short" });
    if (r.success) throw new Error("should have rejected");
  });
  assert("rejects empty actionItems array", () => {
    const r = aiSummarizeMeetingResponseSchema.safeParse({ ...result, actionItems: [] });
    if (r.success) throw new Error("should have rejected");
  });
  assert("rejects actionItem missing task field", () => {
    const r = aiSummarizeMeetingResponseSchema.safeParse({
      ...result,
      actionItems: [{ owner: "Alex" }]
    });
    if (r.success) throw new Error("should have rejected");
  });
  assert("openQuestions defaults to [] when omitted", () => {
    const r = aiSummarizeMeetingResponseSchema.parse(
      (() => { const { openQuestions: _, ...rest } = result; return rest; })()
    );
    if (!Array.isArray(r.openQuestions)) throw new Error("missing default");
  });
  assert("accepts empty openQuestions array", () => {
    aiSummarizeMeetingResponseSchema.parse({ ...result, openQuestions: [] });
  });

  console.log("\n── output format (copy-paste readiness) ──");

  assert("task is a verb phrase (starts with capital letter)", () => {
    const bad = result.actionItems.find((item) => !/^[A-Z]/.test(item.task));
    if (bad) throw new Error(`task not capitalized: "${bad.task}"`);
  });
  assert("no item contains raw '@' mentions or markdown headers", () => {
    for (const item of result.actionItems) {
      if (item.task.startsWith("#") || item.task.includes("@"))
        throw new Error(`raw formatting in task: "${item.task}"`);
    }
  });

  console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
