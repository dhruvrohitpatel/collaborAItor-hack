import { createHash } from "node:crypto";

import type { BadgeCredential, BadgeType, Team } from "@/types/domain";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array) {
  if (bytes.length === 0) {
    return "";
  }

  const digits = [0];

  for (const byte of bytes) {
    let carry = byte;

    for (let index = 0; index < digits.length; index += 1) {
      const value = digits[index] * 256 + carry;
      digits[index] = value % 58;
      carry = Math.floor(value / 58);
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let output = "";

  for (const byte of bytes) {
    if (byte !== 0) {
      break;
    }
    output += BASE58_ALPHABET[0];
  }

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    output += BASE58_ALPHABET[digits[index]];
  }

  return output;
}

function buildReferenceSeed(input: string) {
  return createHash("sha256").update(input).digest().subarray(0, 32);
}

export function prepareSolanaBadgeReference(input: {
  subjectType: BadgeCredential["subjectType"];
  subjectId: string;
  badgeType: BadgeType;
  updatedAt: string;
}) {
  const seed = buildReferenceSeed(
    `${input.subjectType}:${input.subjectId}:${input.badgeType}:${input.updatedAt}`
  );

  return encodeBase58(seed);
}

export function isTeamEligibleForGoodStandingBadge(team: Team) {
  const hasHighRisk = team.riskFlags.some((flag) => flag.severity === "high");

  return !hasHighRisk;
}

export function buildTeamGoodStandingBadge(input: {
  team: Team;
  existingBadge?: BadgeCredential | null;
}) {
  const updatedAt = new Date().toISOString();
  const isActive = isTeamEligibleForGoodStandingBadge(input.team);
  const badgeId = input.existingBadge?.id ?? `badge-team-${input.team.id}-good-standing`;
  const issuedAt =
    isActive ? input.existingBadge?.issuedAt ?? updatedAt : input.existingBadge?.issuedAt ?? null;

  return {
    id: badgeId,
    subjectType: "team",
    subjectId: input.team.id,
    badgeType: "good_standing",
    isActive,
    issuedAt,
    updatedAt,
    reasonSummary: isActive
      ? "No high-severity team risk flags are active, so this team is currently on track."
      : "Badge inactive because the team currently has at least one high-severity collaboration risk.",
    solanaNetwork: "devnet",
    solanaReference: isActive
      ? prepareSolanaBadgeReference({
          subjectType: "team",
          subjectId: input.team.id,
          badgeType: "good_standing",
          updatedAt
        })
      : null,
    transactionSignature: input.existingBadge?.transactionSignature ?? null,
    proofStatus: isActive ? "reference_prepared" : "none"
  } satisfies BadgeCredential;
}
