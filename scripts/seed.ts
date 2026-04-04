import fs from "node:fs/promises";
import path from "node:path";

import { seedStudents } from "@/data/seedStudents";
import { generateMockProfile } from "@/lib/ai/mock";
import { studentIntakeSchema } from "@/lib/schemas";
import { generateTeamsDeterministic } from "@/lib/teamFormation";

const statePath = path.join(process.cwd(), "data", "mockState.json");

async function run() {
  const resetMode = process.argv.includes("--reset");

  if (resetMode) {
    const emptyState = {
      students: [],
      profiles: [],
      teams: [],
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(statePath, JSON.stringify(emptyState, null, 2), "utf8");
    // eslint-disable-next-line no-console
    console.log("Mock state reset.");
    return;
  }

  const validatedStudents = seedStudents.map((student) => studentIntakeSchema.parse(student));

  const profiles = await Promise.all(
    validatedStudents.map(async (student) => {
      const profile = await generateMockProfile(student);
      return {
        ...student,
        ...profile,
        profileGeneratedAt: new Date().toISOString()
      };
    })
  );

  const teams = generateTeamsDeterministic(profiles, 4);

  const state = {
    students: validatedStudents,
    profiles,
    teams,
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf8");

  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${state.students.length} students, ${state.profiles.length} profiles, and ${state.teams.length} teams.`
  );
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
