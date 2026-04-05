import { seedStudents } from "@/data/seedStudents";
import { generateMockProfile } from "@/lib/ai/mock";
import { generateTeamsDeterministic } from "@/lib/teamFormation";
import type { Team } from "@/types/domain";

export async function createSeedTeams(teamSize = 4): Promise<Team[]> {
  const profiles = await Promise.all(
    seedStudents.map(async (student) => {
      const profile = await generateMockProfile(student);
      return {
        ...student,
        ...profile,
        profileGeneratedAt: new Date(0).toISOString()
      };
    })
  );

  return generateTeamsDeterministic(profiles, teamSize);
}
