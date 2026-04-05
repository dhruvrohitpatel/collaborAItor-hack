/**
 * Deterministic demo message histories used when no real activity data exists.
 *
 * Team-1: balanced participation — no alerts expected.
 * Team-2: one member severely disengaged — triggers high-severity alert.
 * Team-3: moderate imbalance — triggers low-severity alert.
 *
 * Timestamps are fixed relative to 2026-04-04T00:00:00Z so results are
 * stable across runs regardless of actual system time.
 */

import type { TeamMessage } from "@/types/domain";

/** Epoch anchor for seed data — 2026-04-04T00:00:00Z */
const ANCHOR = new Date("2026-04-04T00:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

function ts(daysAgo: number, hourOffset = 0): string {
  return new Date(ANCHOR - daysAgo * DAY + hourOffset * 3600 * 1000).toISOString();
}

/**
 * Generate deterministic seed messages for a team.
 * Members are identified by position in the provided array.
 *
 * @param teamId   Used to select the participation pattern.
 * @param members  Ordered list of { id, name } for this team.
 */
export function getSeedMessages(
  teamId: string,
  members: { id: string; name: string }[]
): TeamMessage[] {
  if (members.length < 2) return [];

  const [m0, m1, m2, m3 = members[0]] = members;

  // ── Team-1: balanced (≈25% each) ─────────────────────────────────────────
  if (teamId === "Team-1") {
    return [
      { memberId: m0.id, memberName: m0.name, timestamp: ts(6, 9), wordCount: 42 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(6, 10), wordCount: 38 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(6, 11), wordCount: 55 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(6, 14), wordCount: 29 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(5, 9), wordCount: 61 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(5, 11), wordCount: 44 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(4, 10), wordCount: 33 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(4, 15), wordCount: 47 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(3, 9), wordCount: 52 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(3, 13), wordCount: 36 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(2, 10), wordCount: 48 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(2, 16), wordCount: 31 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(1, 9), wordCount: 44 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(1, 11), wordCount: 57 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(0, 9), wordCount: 39 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(0, 14), wordCount: 50 }
    ];
  }

  // ── Team-2: m3 severely disengaged (1 message, silent 5 days) ────────────
  if (teamId === "Team-2") {
    return [
      { memberId: m0.id, memberName: m0.name, timestamp: ts(6, 9), wordCount: 58 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(6, 10), wordCount: 45 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(6, 11), wordCount: 62 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(5, 8), wordCount: 11 }, // only message
      { memberId: m0.id, memberName: m0.name, timestamp: ts(5, 14), wordCount: 71 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(4, 10), wordCount: 53 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(4, 13), wordCount: 49 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(3, 9), wordCount: 66 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(3, 12), wordCount: 41 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(2, 11), wordCount: 57 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(2, 15), wordCount: 74 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(1, 10), wordCount: 60 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(1, 14), wordCount: 43 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(0, 9), wordCount: 55 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(0, 13), wordCount: 38 }
    ]; // m3: 1/15 messages = 7%, silent 5 days → high severity
  }

  // ── Team-3: m2 mildly under threshold (2 messages, silent 3 days) ────────
  if (teamId === "Team-3") {
    return [
      { memberId: m0.id, memberName: m0.name, timestamp: ts(6, 9), wordCount: 50 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(6, 10), wordCount: 47 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(6, 14), wordCount: 22 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(5, 9), wordCount: 55 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(5, 13), wordCount: 63 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(4, 10), wordCount: 44 },
      { memberId: m2.id, memberName: m2.name, timestamp: ts(3, 8), wordCount: 18 }, // last message
      { memberId: m3.id, memberName: m3.name, timestamp: ts(3, 15), wordCount: 61 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(2, 9), wordCount: 57 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(2, 13), wordCount: 39 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(1, 10), wordCount: 52 },
      { memberId: m0.id, memberName: m0.name, timestamp: ts(1, 14), wordCount: 48 },
      { memberId: m1.id, memberName: m1.name, timestamp: ts(0, 9), wordCount: 43 },
      { memberId: m3.id, memberName: m3.name, timestamp: ts(0, 14), wordCount: 36 }
    ]; // m2: 2/14 = 14%, silent 3 days → low severity
  }

  // ── Fallback: balanced pattern for any other team ID ──────────────────────
  const msgs: TeamMessage[] = [];
  for (let day = 6; day >= 0; day--) {
    members.forEach((m, i) => {
      msgs.push({ memberId: m.id, memberName: m.name, timestamp: ts(day, 9 + i * 2), wordCount: 30 + i * 5 });
    });
  }
  return msgs;
}
