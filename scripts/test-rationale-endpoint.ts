import { generateMockRationale } from "../lib/ai/mock";
import { buildTeamRationalePrompt } from "../lib/ai/prompts";
import { aiGenerateTeamsRationaleResponseSchema } from "../lib/ai/schemas";
import type { AIGenerateTeamsRationaleRequest } from "../lib/ai/schemas";

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

const basePayload: AIGenerateTeamsRationaleRequest = {
  teamId: "Team-1",
  memberNames: ["Jordan Lee", "Alex Kim", "Sam Patel", "Morgan Wu"],
  scoreSummary: {
    skillDiversity: 80,
    availabilityOverlap: 45,
    communicationBalance: 70,
    leadershipDistribution: 100,
    growthOpportunityFit: 82,
    riskPenalty: 10,
    total: 74
  },
  riskFlags: [{ label: "Low schedule overlap", severity: "medium" }]
};

const noFlagsPayload: AIGenerateTeamsRationaleRequest = {
  ...basePayload,
  teamId: "Team-2",
  riskFlags: []
};

const highRiskPayload: AIGenerateTeamsRationaleRequest = {
  ...basePayload,
  teamId: "Team-3",
  scoreSummary: { ...basePayload.scoreSummary, availabilityOverlap: 20, total: 48 },
  riskFlags: [
    { label: "Low schedule overlap", severity: "high" },
    { label: "Leadership coverage gap", severity: "medium" }
  ]
};

async function main() {
  console.log("\n── buildTeamRationalePrompt ──");

  const prompt = buildTeamRationalePrompt(basePayload);

  assert("prompt includes team id", () => {
    if (!prompt.includes("Team-1")) throw new Error("teamId missing");
  });
  assert("prompt includes all member names", () => {
    for (const name of basePayload.memberNames) {
      if (!prompt.includes(name)) throw new Error(`${name} missing from prompt`);
    }
  });
  assert("prompt includes score level labels not raw numbers", () => {
    if (!prompt.includes("strong") && !prompt.includes("moderate") && !prompt.includes("limited"))
      throw new Error("score level descriptors missing");
  });
  assert("prompt includes risk flag label", () => {
    if (!prompt.includes("Low schedule overlap")) throw new Error("risk flag missing");
  });
  assert("prompt requests JSON with rationale key", () => {
    if (!prompt.includes('"rationale"')) throw new Error("JSON shape spec missing");
  });
  assert("prompt instructs 2-4 sentences", () => {
    if (!prompt.includes("2-4 sentences")) throw new Error("length instruction missing");
  });

  console.log("\n── generateMockRationale ──");

  const rationale = await generateMockRationale(basePayload);

  assert("rationale is a non-empty string", () => {
    if (!rationale || rationale.trim().length === 0) throw new Error("empty rationale");
  });
  assert("rationale is 2-4 sentences", () => {
    const sentences = rationale.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 2 || sentences.length > 4)
      throw new Error(`got ${sentences.length} sentence(s), expected 2-4`);
  });
  assert("rationale mentions the risk flag when present", () => {
    const lower = rationale.toLowerCase();
    if (!lower.includes("schedule") && !lower.includes("overlap") && !lower.includes("watch"))
      throw new Error("risk flag not reflected in rationale");
  });
  const noFlagCheck = await generateMockRationale(noFlagsPayload);
  assert("no-flag rationale says no risks flagged", () => {
    if (!noFlagCheck.toLowerCase().includes("no") && !noFlagCheck.toLowerCase().includes("none"))
      throw new Error("expected no-risk signal in rationale");
  });

  const noFlagRationale = await generateMockRationale(noFlagsPayload);
  assert("no-flag rationale is still 2-4 sentences", () => {
    const sentences = noFlagRationale.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 2 || sentences.length > 4)
      throw new Error(`got ${sentences.length} sentence(s)`);
  });

  const highRiskRationale = await generateMockRationale(highRiskPayload);
  assert("high-risk rationale references the primary flag", () => {
    const lower = highRiskRationale.toLowerCase();
    if (!lower.includes("schedule") && !lower.includes("overlap"))
      throw new Error("primary risk flag not mentioned");
  });

  console.log("\n── aiGenerateTeamsRationaleResponseSchema ──");

  assert("schema accepts valid rationale", () => {
    aiGenerateTeamsRationaleResponseSchema.parse({ rationale });
  });
  assert("schema rejects missing rationale field", () => {
    const result = aiGenerateTeamsRationaleResponseSchema.safeParse({});
    if (result.success) throw new Error("should have rejected");
  });
  assert("mock output passes schema", () => {
    aiGenerateTeamsRationaleResponseSchema.parse({ rationale });
  });

  console.log("\n── determinism ──");

  const r2 = await generateMockRationale(basePayload);
  assert("mock rationale is deterministic", () => {
    if (rationale !== r2) throw new Error("non-deterministic output");
  });

  console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
