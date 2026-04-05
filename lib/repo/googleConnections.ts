import fs from "node:fs/promises";
import path from "node:path";

import { isMockDataEnabled } from "@/lib/config";
import { googleConnectionSchema } from "@/lib/schemas";
import {
  getFirestoreGoogleConnectionByEmail,
  listFirestoreGoogleConnectionsByEmails,
  saveFirestoreGoogleConnection
} from "@/lib/repo/firestoreRepository";
import type { GoogleConnectionInput } from "@/lib/schemas";

const mockGoogleConnectionsPath = path.join(
  process.cwd(),
  "data",
  "mockGoogleConnections.json"
);

let inMemoryConnections: GoogleConnectionInput[] | null = null;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function googleConnectionIdFromIdentity(input: {
  firebaseUid: string | null;
  email: string;
}) {
  if (input.firebaseUid) {
    return `uid_${input.firebaseUid}`;
  }

  return `email_${normalizeEmail(input.email).replace(/[^a-z0-9]/g, "_")}`;
}

async function readMockConnections() {
  if (inMemoryConnections) {
    return inMemoryConnections;
  }

  try {
    const raw = await fs.readFile(mockGoogleConnectionsPath, "utf8");
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed)
      ? parsed.map((entry) => googleConnectionSchema.parse(entry))
      : [];
    inMemoryConnections = records;
    return inMemoryConnections;
  } catch {
    inMemoryConnections = [];
    return inMemoryConnections;
  }
}

async function persistMockConnections(records: GoogleConnectionInput[]) {
  inMemoryConnections = records;
  await fs.writeFile(mockGoogleConnectionsPath, JSON.stringify(records, null, 2), "utf8");
}

async function getMockGoogleConnectionByEmail(email: string) {
  const records = await readMockConnections();
  const normalized = normalizeEmail(email);
  return (
    records.find((record) => normalizeEmail(record.email) === normalized) ?? null
  );
}

async function listMockGoogleConnectionsByEmails(emails: string[]) {
  const records = await readMockConnections();
  const target = new Set(emails.map(normalizeEmail));
  return records.filter((record) => target.has(normalizeEmail(record.email)));
}

async function saveMockGoogleConnection(connection: GoogleConnectionInput) {
  const records = await readMockConnections();
  const parsed = googleConnectionSchema.parse(connection);
  const next = records.filter((record) => record.id !== parsed.id);
  next.push(parsed);
  await persistMockConnections(next);
  return parsed;
}

export async function getGoogleConnectionByEmail(email: string) {
  if (isMockDataEnabled()) {
    return getMockGoogleConnectionByEmail(email);
  }

  return getFirestoreGoogleConnectionByEmail(email);
}

export async function listGoogleConnectionsByEmails(emails: string[]) {
  if (!emails.length) {
    return [];
  }

  if (isMockDataEnabled()) {
    return listMockGoogleConnectionsByEmails(emails);
  }

  return listFirestoreGoogleConnectionsByEmails(emails);
}

export async function saveGoogleConnection(connection: GoogleConnectionInput) {
  if (isMockDataEnabled()) {
    return saveMockGoogleConnection(connection);
  }

  return saveFirestoreGoogleConnection(connection);
}

export async function revokeGoogleConnectionByEmail(email: string) {
  const existing = await getGoogleConnectionByEmail(email);
  if (!existing) {
    return null;
  }

  const revoked = {
    ...existing,
    revokedAt: new Date().toISOString()
  };

  return saveGoogleConnection(revoked);
}
