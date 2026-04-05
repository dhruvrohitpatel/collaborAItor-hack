import { rewriteMessage } from "../lib/ai/mock";
import { buildRewritePrompt } from "../lib/ai/prompts";
import {
  aiRewriteMessageRequestSchema,
  aiRewriteMessageResponseSchema
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

const roughMessage = "Can someone please finish their part? We are behind and this is unacceptable.";
const tones = ["polite", "direct", "encouraging", "professional"] as const;

async function main() {
  console.log("\n── aiRewriteMessageRequestSchema ──");

  assert("accepts valid payload", () => {
    aiRewriteMessageRequestSchema.parse({ message: roughMessage, tone: "polite", audience: "project team" });
  });
  assert("rejects message shorter than 5 chars", () => {
    const r = aiRewriteMessageRequestSchema.safeParse({ message: "hi", tone: "polite", audience: "team" });
    if (r.success) throw new Error("should have rejected");
  });
  assert("rejects invalid tone", () => {
    const r = aiRewriteMessageRequestSchema.safeParse({ message: roughMessage, tone: "aggressive", audience: "team" });
    if (r.success) throw new Error("should have rejected");
  });
  assert("rejects audience shorter than 2 chars", () => {
    const r = aiRewriteMessageRequestSchema.safeParse({ message: roughMessage, tone: "polite", audience: "x" });
    if (r.success) throw new Error("should have rejected");
  });

  console.log("\n── buildRewritePrompt ──");

  const prompt = buildRewritePrompt(roughMessage, "polite", "student project team");

  assert("includes original message", () => {
    if (!prompt.includes(roughMessage)) throw new Error("original message missing");
  });
  assert("requests JSON with rewrittenMessage and notes fields", () => {
    if (!prompt.includes('"rewrittenMessage"') || !prompt.includes('"notes"'))
      throw new Error("JSON shape missing");
  });
  assert("includes tone name in prompt", () => {
    if (!prompt.includes("polite")) throw new Error("tone missing");
  });
  assert("includes audience in prompt", () => {
    if (!prompt.includes("student project team")) throw new Error("audience missing");
  });
  assert("instructs intent preservation", () => {
    if (!prompt.toLowerCase().includes("intent")) throw new Error("intent preservation instruction missing");
  });
  assert("prompt builds for all four tones without error", () => {
    for (const tone of tones) buildRewritePrompt(roughMessage, tone, "team");
  });

  console.log("\n── rewriteMessage mock ──");

  for (const tone of tones) {
    const result = await rewriteMessage(roughMessage, tone, "project team");

    assert(`[${tone}] rewrittenMessage is non-empty`, () => {
      if (!result.rewrittenMessage || result.rewrittenMessage.trim().length === 0)
        throw new Error("empty rewrittenMessage");
    });
    assert(`[${tone}] rewrittenMessage differs from original`, () => {
      if (result.rewrittenMessage.trim() === roughMessage.trim())
        throw new Error("message unchanged");
    });
    assert(`[${tone}] notes is non-empty`, () => {
      if (!result.notes || result.notes.trim().length === 0) throw new Error("empty notes");
    });
    assert(`[${tone}] output passes schema`, () => {
      aiRewriteMessageResponseSchema.parse(result);
    });
  }

  console.log("\n── intent preservation ──");

  const shortMessage = "Please send me the report.";
  for (const tone of tones) {
    const result = await rewriteMessage(shortMessage, tone, "colleague");
    assert(`[${tone}] preserves 'report' keyword from original`, () => {
      if (!result.rewrittenMessage.toLowerCase().includes("report"))
        throw new Error(`'report' lost in ${tone} rewrite`);
    });
  }

  console.log("\n── rough language handling ──");

  const aggressiveMessage = "You failed to deliver again. You need to just do it.";
  const politeResult = await rewriteMessage(aggressiveMessage, "polite", "team");

  assert("softens 'failed' language", () => {
    if (politeResult.rewrittenMessage.toLowerCase().includes("failed"))
      throw new Error("'failed' not softened");
  });
  assert("removes 'just do it' directive", () => {
    if (politeResult.rewrittenMessage.toLowerCase().includes("just do it"))
      throw new Error("rough directive not removed");
  });

  console.log("\n── aiRewriteMessageResponseSchema ──");

  const sample = await rewriteMessage(roughMessage, "professional", "team");
  assert("rejects rewrittenMessage shorter than 10 chars", () => {
    const r = aiRewriteMessageResponseSchema.safeParse({ ...sample, rewrittenMessage: "Short." });
    if (r.success) throw new Error("should have rejected");
  });
  assert("rejects notes shorter than 5 chars", () => {
    const r = aiRewriteMessageResponseSchema.safeParse({ ...sample, notes: "Ok." });
    if (r.success) throw new Error("should have rejected");
  });
  assert("accepts valid response", () => {
    aiRewriteMessageResponseSchema.parse(sample);
  });

  console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
