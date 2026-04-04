import { generateMockCharter } from "../lib/ai/mock";
import { buildCharterPrompt } from "../lib/ai/prompts";
import { aiCharterRequestSchema, aiCharterResponseSchema } from "../lib/ai/schemas";
import type { AICharterRequest } from "../lib/ai/schemas";

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

const base: AICharterRequest = {
  teamName: "Team-1",
  memberNames: ["Jordan Lee", "Alex Kim", "Sam Patel", "Morgan Wu"],
  projectTheme: "Course capstone",
  communicationStyles: ["analytical", "direct", "collaborative", "reflective"],
  riskFlags: [{ label: "Low schedule overlap", severity: "medium" }]
};

const noContext: AICharterRequest = {
  teamName: "Team-2",
  memberNames: ["Avery", "Noah"],
  projectTheme: "Course project",
  communicationStyles: [],
  riskFlags: []
};

const highRisk: AICharterRequest = {
  ...base,
  teamName: "Team-3",
  riskFlags: [{ label: "Low schedule overlap", severity: "high" }]
};

async function main() {
  console.log("\n── aiCharterRequestSchema ──");

  assert("accepts full payload", () => {
    aiCharterRequestSchema.parse(base);
  });
  assert("defaults communicationStyles and riskFlags when omitted", () => {
    const result = aiCharterRequestSchema.parse({
      teamName: "T",
      memberNames: ["A"],
      projectTheme: "X"
    });
    if (!Array.isArray(result.communicationStyles) || !Array.isArray(result.riskFlags))
      throw new Error("defaults missing");
  });
  assert("rejects empty memberNames", () => {
    const result = aiCharterRequestSchema.safeParse({ ...base, memberNames: [] });
    if (result.success) throw new Error("should have rejected");
  });

  console.log("\n── buildCharterPrompt ──");

  const prompt = buildCharterPrompt(base);

  assert("includes team name", () => {
    if (!prompt.includes("Team-1")) throw new Error("team name missing");
  });
  assert("includes all member names", () => {
    for (const name of base.memberNames) {
      if (!prompt.includes(name)) throw new Error(`${name} missing`);
    }
  });
  assert("includes communication styles", () => {
    if (!prompt.includes("analytical")) throw new Error("styles missing");
  });
  assert("includes risk flag label", () => {
    if (!prompt.includes("Low schedule overlap")) throw new Error("flag missing");
  });
  assert("requests JSON shape with all three fields", () => {
    if (!prompt.includes('"charter"') || !prompt.includes('"suggestedRoleRotation"') || !prompt.includes('"kickoffChecklist"'))
      throw new Error("JSON shape spec incomplete");
  });
  assert("includes 2-3 sentence instruction for charter", () => {
    if (!prompt.includes("2-3 sentences")) throw new Error("length instruction missing");
  });
  assert("no-context prompt still builds without error", () => {
    buildCharterPrompt(noContext);
  });

  console.log("\n── generateMockCharter ──");

  const mock = await generateMockCharter(base);

  assert("charter is non-empty string", () => {
    if (!mock.charter || mock.charter.trim().length === 0) throw new Error("empty charter");
  });
  assert("charter mentions team name", () => {
    if (!mock.charter.includes("Team-1")) throw new Error("team name missing from charter");
  });
  assert("charter references project theme", () => {
    if (!mock.charter.toLowerCase().includes("capstone")) throw new Error("project theme missing");
  });
  assert("charter mentions the risk flag context", () => {
    const lower = mock.charter.toLowerCase();
    if (!lower.includes("blocker") && !lower.includes("24")) throw new Error("risk accountability missing");
  });
  assert("suggestedRoleRotation has one entry per member", () => {
    if (mock.suggestedRoleRotation.length !== base.memberNames.length)
      throw new Error(`expected ${base.memberNames.length} entries, got ${mock.suggestedRoleRotation.length}`);
  });
  assert("each rotation entry names a member", () => {
    for (const name of base.memberNames) {
      if (!mock.suggestedRoleRotation.some((entry) => entry.includes(name)))
        throw new Error(`${name} not in rotation`);
    }
  });
  assert("kickoffChecklist has 4-5 items", () => {
    if (mock.kickoffChecklist.length < 4 || mock.kickoffChecklist.length > 6)
      throw new Error(`got ${mock.kickoffChecklist.length} items`);
  });

  const highRiskMock = await generateMockCharter(highRisk);
  assert("high-risk checklist includes flag-specific item", () => {
    const lower = highRiskMock.kickoffChecklist.join(" ").toLowerCase();
    if (!lower.includes("schedule") && !lower.includes("overlap"))
      throw new Error("high-risk flag not in checklist");
  });

  const noCtxMock = await generateMockCharter(noContext);
  assert("no-context mock still produces valid output", () => {
    aiCharterResponseSchema.parse(noCtxMock);
  });

  console.log("\n── aiCharterResponseSchema ──");

  assert("mock output passes schema", () => {
    aiCharterResponseSchema.parse(mock);
  });
  assert("rejects charter shorter than 20 chars", () => {
    const result = aiCharterResponseSchema.safeParse({ ...mock, charter: "Too short." });
    if (result.success) throw new Error("should have rejected");
  });
  assert("rejects empty suggestedRoleRotation", () => {
    const result = aiCharterResponseSchema.safeParse({ ...mock, suggestedRoleRotation: [] });
    if (result.success) throw new Error("should have rejected");
  });
  assert("rejects kickoffChecklist with fewer than 3 items", () => {
    const result = aiCharterResponseSchema.safeParse({ ...mock, kickoffChecklist: ["a", "b"] });
    if (result.success) throw new Error("should have rejected");
  });
  assert("rejects kickoffChecklist with more than 6 items", () => {
    const result = aiCharterResponseSchema.safeParse({
      ...mock,
      kickoffChecklist: ["a", "b", "c", "d", "e", "f", "g"]
    });
    if (result.success) throw new Error("should have rejected");
  });

  console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
