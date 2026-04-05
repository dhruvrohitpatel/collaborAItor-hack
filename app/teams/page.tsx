import { DerivedDataAlert } from "@/components/shared/derived-data-alert";
import { TeamActions } from "@/components/teams/team-actions";
import { TeamCard } from "@/components/teams/team-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_TEAM_SIZE, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "@/lib/config";
import { getDemoState } from "@/lib/repo";

export default async function TeamsPage() {
  const state = await getDemoState();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Team Generation</h1>
          <p className="text-sm text-muted-foreground">
            Deterministic team formation with transparent rationale and risk flags.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              Team size bounds: {MIN_TEAM_SIZE} to {MAX_TEAM_SIZE}
            </Badge>
            <Badge variant="outline">Default size: {DEFAULT_TEAM_SIZE}</Badge>
          </div>
        </div>
        <TeamActions />
      </div>

      <DerivedDataAlert
        profilesStale={state.profilesStale}
        teamsStale={state.teamsStale}
      />

      <Card>
        <CardHeader>
          <CardTitle>Generated Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {state.teams.length ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {state.teams.map((team) => (
                <TeamCard key={team.id} team={team} teams={state.teams} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No teams yet. Generate teams to continue.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
