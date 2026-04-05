import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

function loadLocalEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const fileContents = fs.readFileSync(envPath, "utf8");

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

loadLocalEnvFile();

const require = createRequire(import.meta.url);

async function run() {
  const { doc, writeBatch } = require("firebase/firestore") as typeof import("firebase/firestore");
  const { expandedStudents } =
    require("@/data/generateExpandedStudents") as typeof import("@/data/generateExpandedStudents");
  const { getFirestoreDb } = require("@/lib/firebase") as typeof import("@/lib/firebase");

  const db = getFirestoreDb();

  if (!db) {
    throw new Error(
      "Firestore is not configured. Set the required NEXT_PUBLIC_FIREBASE_* environment variables before seeding."
    );
  }

  const batch = writeBatch(db);

  for (const student of expandedStudents) {
    batch.set(doc(db, "students", student.id), student);
  }

  await batch.commit();

  // eslint-disable-next-line no-console
  console.log(`Seeded ${expandedStudents.length} students into Firestore collection "students".`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown Firestore seeding error.";

  // eslint-disable-next-line no-console
  console.error("Failed to seed Firestore students:", message);

  if (error instanceof Error && error.stack) {
    // eslint-disable-next-line no-console
    console.error(error.stack);
  }

  process.exit(1);
});
