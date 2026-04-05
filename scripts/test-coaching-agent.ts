import { computeParticipation, detectDisengagement } from "../lib/ai/participation";
import { generateMockCoachingAlerts } from "../lib/ai/mock";
import { buildCoachingPrompt } from "../lib/ai/prompts";
import { aiCoachingRequestSchema, aiCoachingResponseSchema } from "../lib/ai/schemas";
import { getSeedMessages } from "../data/seedMessages";
import type { TeamMessage } from "../types/domain";

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

const members = [
  { id: "m1", name: "Alex" },
  { id: "m2", name: "Sam" },
  { id: "m3", name: "Jordan" },
  { id: "m4", name: "Morgan" }
];

// Fixed anchor: 2026-04-04T00:00:00Z
const NOW = new Date("2026-04-04T00:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function ts(daysAgo: number): string {
  return new Date(NOW.getTime() - daysAgo * DAY).toISOString();
}

// Balanced messages: ~25% each
const balancedMessages: TeamMessage[] = [
  ...Array.from({ length: 5 }, (_, i) => ({ memberId: "m1", memberName: "Alex", timestamp: ts(i), wordCount: 40 })),
  ...Array.from({ length: 5 }, (_, i) => ({ memberId: "m2", memberName: "Sam", timestamp: ts(i + 1), wordCount: 35 })),
  ...Array.from({ length: 5 }, (_, i) => ({ memberId: "m3", memberName: "Jordan", timestamp: ts(i), wordCount: 38 })),
  ...Array.from({ length: 5 }, (_, i) => ({ memberId: "m4", memberName: "Morgan", timestamp: ts(i + 1), wordCount: 42 }))
];

// Disengaged: m4 has 1 message 5 days ago (7%), everyone else ~31%
const disengagedMessages: TeamMessage[] = [
  ...Array.from({ length: 5 }, (_, i) => ({ memberId: "m1", memberName: "Alex", timestamp: ts(i), wordCount: 50 })),
  ...Array.from({ length: 4 }, (_, i) => ({ memberId: "m2", memberName: "Sam", timestamp: ts(i), wordCount: 45 })),
  ...Array.from({ length: 4 }, (_, i) => ({ memberId: "m3", memberName: "Jordan", timestamp: ts(i + 1), wordCount: 40 })),
  { memberId: "m4", memberName: "Morgan", timestamp: ts(5), wordCount: 12 }
];

const defaultThresholds = { minSharePercent: 15, silenceDays: 3 };

async function main() {
  console.log("\n── aiCoachingRequestSchema ──");

  assert("accepts full payload", () => {
    aiCoachingRequestSchema.parse({
      teamId: "Team-1",
      members,
      messages: balancedMessages,
      windowDays: 7,
      thresholds: defaultThresholds
    });
  });
  assert("defaults messages to [], windowDays to 7, thresholds to defaults", () => {
    const r = aiCoachingRequestSchema.parse({ teamId: "T", members });
    if (r.messages.length !== 0) throw new Error("messages default wrong");
    if (r.windowDays !== 7) throw new Error("windowDays default wrong");
    if (r.thresholds.minSharePercent !== 15) throw new Error("threshold default wrong");
  });
  assert("rejects members array with fewer than 2 entries", () => {
    const r = aiCoachingRequestSchema.safeParse({ teamId: "T", members: [{ id: "x", name: "X" }] });
    if (r.success) throw new Error("should have rejected");
  });

  console.log("\n── computeParticipation ──");

  const balancedSignals = computeParticipation(balancedMessages, members, 7, NOW);

  assert("returns one signal per member", () => {
    if (balancedSignals.length !== members.length) throw new Error("wrong count");
  });
  assert("share percents sum to ~100", () => {
    const total = balancedSignals.reduce((s, m) => s + m.sharePercent, 0);
    if (total < 98 || total > 102) throw new Error(`sum was ${total}`);
  });
  assert("balanced: each member has ~25% share", () => {
    for (const s of balancedSignals) {
      if (s.sharePercent < 20 || s.sharePercent > 30)
        throw new Error(`${s.memberName} has ${s.sharePercent}%`);
    }
  });

  const disengagedSignals = computeParticipation(disengagedMessages, members, 7, NOW);
  const morgan = disengagedSignals.find((s) => s.memberName === "Morgan")!;

  assert("disengaged member has low sharePercent", () => {
    if (morgan.sharePercent >= 15) throw new Error(`expected <15, got ${morgan.sharePercent}`);
  });
  assert("disengaged member has daysSilent >= 5", () => {
    if (morgan.daysSilent < 5) throw new Error(`expected ≥5, got ${morgan.daysSilent}`);
  });
  assert("member with no messages gets daysSilent = windowDays", () => {
    const noMsgs = computeParticipation([], [{ id: "x", name: "Ghost" }], 7, NOW);
    if (noMsgs[0].daysSilent !== 7) throw new Error(`got ${noMsgs[0].daysSilent}`);
  });

  console.log("\n── detectDisengagement ──");

  const balancedCandidates = detectDisengagement(balancedSignals, defaultThresholds);
  assert("balanced team: no candidates flagged", () => {
    if (balancedCandidates.length !== 0) throw new Error(`got ${balancedCandidates.length} flags`);
  });

  const disengagedCandidates = detectDisengagement(disengagedSignals, defaultThresholds);
  assert("disengaged team: Morgan is flagged", () => {
    if (!disengagedCandidates.find((c) => c.signal.memberName === "Morgan"))
      throw new Error("Morgan not flagged");
  });
  assert("disengaged candidate has high severity (both thresholds breached)", () => {
    const c = disengagedCandidates.find((c) => c.signal.memberName === "Morgan")!;
    if (c.severity !== "high") throw new Error(`got ${c.severity}`);
  });
  assert("reasons array is non-empty", () => {
    for (const c of disengagedCandidates) {
      if (c.reasons.length === 0) throw new Error("empty reasons");
    }
  });

  console.log("\n── getSeedMessages ──");

  const team1Messages = getSeedMessages("Team-1", members);
  const team2Messages = getSeedMessages("Team-2", members);

  assert("Team-1 seed: produces ≥16 messages", () => {
    if (team1Messages.length < 16) throw new Error(`got ${team1Messages.length}`);
  });
  assert("Team-1 seed: all 4 members have messages", () => {
    const ids = new Set(team1Messages.map((m) => m.memberId));
    if (ids.size !== 4) throw new Error(`only ${ids.size} members have messages`);
  });
  assert("Team-2 seed: last member (m4) has very low participation", () => {
    const m4Msgs = team2Messages.filter((m) => m.memberId === members[3].id);
    const total = team2Messages.length;
    const share = Math.round((m4Msgs.length / total) * 100);
    if (share >= 15) throw new Error(`m4 share was ${share}%, expected <15%`);
  });
  assert("seed messages are deterministic across calls", () => {
    const a = getSeedMessages("Team-2", members);
    const b = getSeedMessages("Team-2", members);
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error("non-deterministic");
  });

  console.log("\n── buildCoachingPrompt ──");

  const prompt = buildCoachingPrompt("Team-2", disengagedSignals, disengagedCandidates);

  assert("includes team id", () => {
    if (!prompt.includes("Team-2")) throw new Error("teamId missing");
  });
  assert("includes flagged member name", () => {
    if (!prompt.includes("Morgan")) throw new Error("flagged member missing");
  });
  assert("requests JSON with alerts array", () => {
    if (!prompt.includes('"alerts"')) throw new Error("alerts shape missing");
  });
  assert("instructs non-judgmental language ('may be')", () => {
    if (!prompt.includes("may be") && !prompt.includes("appears to")) throw new Error("non-judgmental instruction missing");
  });
  assert("instructs against using the word 'disengaged'", () => {
    if (!prompt.includes("disengaged")) throw new Error("prohibition missing");
    // The word appears in the rule "Do not use the word 'disengaged'" — that's correct.
  });

  console.log("\n── generateMockCoachingAlerts ──");

  const balanced = generateMockCoachingAlerts("Team-1", balancedSignals, balancedCandidates);
  assert("balanced team: hasAlert is false", () => {
    if (balanced.hasAlert) throw new Error("should be no alert");
  });
  assert("balanced team: alerts array is empty", () => {
    if (balanced.alerts.length !== 0) throw new Error("should be empty");
  });
  assert("participationSummary has one entry per member", () => {
    if (balanced.participationSummary.length !== members.length) throw new Error("wrong count");
  });

  const disengaged = generateMockCoachingAlerts("Team-2", disengagedSignals, disengagedCandidates);
  assert("disengaged team: hasAlert is true", () => {
    if (!disengaged.hasAlert) throw new Error("should have alert");
  });
  assert("alert reason is non-empty and ≥10 chars", () => {
    for (const a of disengaged.alerts) {
      if (a.reason.length < 10) throw new Error(`short reason: "${a.reason}"`);
    }
  });
  assert("alert suggestedFollowUp is non-empty", () => {
    for (const a of disengaged.alerts) {
      if (!a.suggestedFollowUp || a.suggestedFollowUp.length < 10)
        throw new Error("short followUp");
    }
  });
  assert("alert reason does NOT contain the word 'disengaged'", () => {
    for (const a of disengaged.alerts) {
      if (a.reason.toLowerCase().includes("disengaged"))
        throw new Error("found 'disengaged' in reason");
    }
  });

  console.log("\n── aiCoachingResponseSchema ──");

  assert("mock balanced output passes schema", () => {
    aiCoachingResponseSchema.parse(balanced);
  });
  assert("mock disengaged output passes schema", () => {
    aiCoachingResponseSchema.parse(disengaged);
  });
  assert("rejects alert reason shorter than 10 chars", () => {
    const bad = {
      ...disengaged,
      alerts: [{ ...disengaged.alerts[0], reason: "Too short" }]
    };
    const r = aiCoachingResponseSchema.safeParse(bad);
    if (r.success) throw new Error("should have rejected");
  });
  assert("rejects invalid severity value", () => {
    const bad = {
      ...disengaged,
      alerts: [{ ...disengaged.alerts[0], severity: "critical" }]
    };
    const r = aiCoachingResponseSchema.safeParse(bad);
    if (r.success) throw new Error("should have rejected");
  });

  console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
