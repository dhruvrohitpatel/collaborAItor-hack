import type { DemoState, StudentProfile, Team } from "@/types/domain";

type DemoStateInput = {
  students: DemoState["students"];
  profiles: StudentProfile[];
  teams: Team[];
  studentsUpdatedAt?: string | null;
  profilesUpdatedAt?: string | null;
  teamsUpdatedAt?: string | null;
  updatedAt?: string | null;
};

function latestTimestamp(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

/**
 * Builds a consistent demo-state shape whether the source is Firestore or mock
 * JSON. Older persisted state files may not include freshness metadata yet, so
 * this function backfills timestamps and derives stale flags from them.
 */
export function normalizeDemoState(input: DemoStateInput): DemoState {
  const now = new Date().toISOString();
  const fallbackTimestamp = latestTimestamp([
    input.updatedAt,
    ...input.profiles.map((profile) => profile.profileGeneratedAt),
    ...input.teams.flatMap((team) => team.members.map((member) => member.profileGeneratedAt))
  ]) ?? now;

  const studentsUpdatedAt = input.studentsUpdatedAt ?? fallbackTimestamp;
  const profilesUpdatedAt =
    input.profilesUpdatedAt ?? (input.profiles.length ? fallbackTimestamp : null);
  const teamsUpdatedAt = input.teamsUpdatedAt ?? (input.teams.length ? fallbackTimestamp : null);

  const profilesStale = Boolean(
    input.profiles.length && (!profilesUpdatedAt || studentsUpdatedAt > profilesUpdatedAt)
  );
  const teamsStale = Boolean(
    input.teams.length &&
      (
        profilesStale ||
        !teamsUpdatedAt ||
        studentsUpdatedAt > teamsUpdatedAt ||
        (profilesUpdatedAt && profilesUpdatedAt > teamsUpdatedAt)
      )
  );

  return {
    students: input.students,
    profiles: input.profiles,
    teams: input.teams,
    studentsUpdatedAt,
    profilesUpdatedAt,
    teamsUpdatedAt,
    profilesStale,
    teamsStale,
    updatedAt: latestTimestamp([studentsUpdatedAt, profilesUpdatedAt, teamsUpdatedAt, input.updatedAt]) ?? now
  };
}
