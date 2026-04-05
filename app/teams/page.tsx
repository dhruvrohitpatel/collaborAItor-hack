import { TeamActions } from "@/components/teams/team-actions";
import { TeamCard } from "@/components/teams/team-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        </div>
        <TeamActions />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {state.teams.length ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {state.teams.map((team) => (
                <TeamCard key={team.id} team={team} />
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
