/**
 * Pure participation analysis — no Gemini dependency.
 *
 * Computes per-member participation signals from a message window and
 * detects potential disengagement against configurable thresholds.
 * All logic is transparent and exposed in the response so instructors
 * can see exactly why a flag was raised.
 */

import type { TeamMessage, ParticipationSignal } from "@/types/domain";

export type DisengagementCandidate = {
  signal: ParticipationSignal;
  reasons: string[];
  severity: "low" | "medium" | "high";
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute participation signals for each member from messages within
 * the given window. Members with zero messages are included with zeros
 * so they can be flagged for complete silence.
 */
export function computeParticipation(
  messages: TeamMessage[],
  memberIds: { id: string; name: string }[],
  windowDays: number,
  now = new Date()
): ParticipationSignal[] {
  const cutoff = new Date(now.getTime() - windowDays * MS_PER_DAY);

  const windowed = messages.filter((m) => new Date(m.timestamp) >= cutoff);
  const totalMessages = windowed.length;

  return memberIds.map(({ id, name }) => {
    const mine = windowed.filter((m) => m.memberId === id);
    const messageCount = mine.length;
    const wordCount = mine.reduce((sum, m) => sum + m.wordCount, 0);
    const sharePercent =
      totalMessages > 0 ? Math.round((messageCount / totalMessages) * 100) : 0;

    const timestamps = mine.map((m) => new Date(m.timestamp).getTime());
    const lastTs = timestamps.length > 0 ? Math.max(...timestamps) : null;
    const lastActiveAt = lastTs ? new Date(lastTs).toISOString() : "never";
    const daysSilent =
      lastTs != null
        ? Math.floor((now.getTime() - lastTs) / MS_PER_DAY)
        : windowDays;

    return { memberId: id, memberName: name, messageCount, wordCount, sharePercent, lastActiveAt, daysSilent };
  });
}

/**
 * Return members whose participation falls below the given thresholds.
 * Severity escalates when both the share and silence thresholds are breached.
 */
export function detectDisengagement(
  signals: ParticipationSignal[],
  thresholds: { minSharePercent: number; silenceDays: number }
): DisengagementCandidate[] {
  return signals
    .map((signal) => {
      const reasons: string[] = [];
      let breachCount = 0;

      if (signal.sharePercent < thresholds.minSharePercent) {
        reasons.push(
          `${signal.sharePercent}% of team messages (threshold: ${thresholds.minSharePercent}%)`
        );
        breachCount++;
      }

      if (signal.daysSilent >= thresholds.silenceDays) {
        const since =
          signal.lastActiveAt === "never"
            ? "no messages recorded"
            : `last active ${signal.daysSilent} day${signal.daysSilent === 1 ? "" : "s"} ago`;
        reasons.push(since);
        breachCount++;
      }

      if (reasons.length === 0) return null;

      const severity: "low" | "medium" | "high" =
        breachCount >= 2 && signal.sharePercent < thresholds.minSharePercent / 2
          ? "high"
          : breachCount >= 2
            ? "medium"
            : "low";

      return { signal, reasons, severity };
    })
    .filter((c): c is DisengagementCandidate => c !== null);
}
