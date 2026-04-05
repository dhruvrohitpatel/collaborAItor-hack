import { notFound } from "next/navigation";

import { ScoreSummary } from "@/components/teams/score-summary";
import { RiskBadge } from "@/components/teams/risk-badge";
import { DisengagementPanel } from "@/components/teams/disengagement-panel";
import { AiToolsPanel } from "@/components/tools/ai-tools-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamBadge, getTeamById } from "@/lib/repo";

export const dynamic = "force-dynamic";

type TeamDetailPageProps = {
  params: {
    teamId: string;
  };
};

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const [team, badge] = await Promise.all([getTeamById(params.teamId), getTeamBadge(params.teamId)]);

  if (!team) {
    notFound();
  }

  const isOutOfBounds = team.riskFlags.some(
    (flag) => flag.code === "team_size_over_max" || flag.code === "team_size_under_min"
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{team.id} Detail</h1>
          {isOutOfBounds ? <Badge variant="danger">Out of bounds</Badge> : null}
          {badge?.isActive ? <Badge variant="success">On-Track Team</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">Transparent assignment rationale and support tools.</p>
      </div>

      {badge ? (
        <Card>
          <CardHeader>
            <CardTitle>{badge.isActive ? "Good Standing" : "Needs Attention"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{badge.reasonSummary}</p>
            <p className="text-xs text-muted-foreground">
              {badge.isActive
                ? "A verifiable collaboration credential has been prepared for this team."
                : "Resolve the active high-priority team risks to restore good standing."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Team Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{team.rationale}</p>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Members</p>
              <ul className="mt-1 space-y-1">
                {team.members.map((member) => (
                  <li key={member.id}>
                    {member.name} - {member.preferredRole}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {team.riskFlags.length ? (
                team.riskFlags.map((risk) => <RiskBadge key={risk.code} risk={risk} />)
              ) : (
                <p className="text-xs text-muted-foreground">No major risk flags.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <ScoreSummary score={team.scoreSummary} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DisengagementPanel teamId={team.id} members={team.members} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generated Charter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{team.support.charter}</p>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Suggested Role Rotation
              </p>
              <ul className="mt-1 space-y-1">
                {team.support.suggestedRoleRotation.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kickoff Checklist
              </p>
              <ul className="mt-1 space-y-1">
                {team.support.kickoffChecklist.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <AiToolsPanel
          defaultTeamName={team.id}
          defaultMembers={team.members.map((member) => member.name)}
          communicationStyles={team.members.map((member) => member.communicationStyle)}
          riskFlags={team.riskFlags.map((flag) => ({
            label: flag.label,
            severity: flag.severity
          }))}
        />
      </div>
    </div>
  );
}
