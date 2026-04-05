import Link from "next/link";

import { RiskBadge } from "@/components/teams/risk-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team } from "@/types/domain";

export function TeamCard({ team }: { team: Team }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          {team.id}
          <Badge variant="success">Score {team.scoreSummary.total}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Members</p>
          <ul className="mt-1 space-y-1 text-sm">
            {team.members.map((member) => (
              <li key={member.id}>
                {member.name} <span className="text-xs text-muted-foreground">({member.preferredRole})</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rationale</p>
          <p className="mt-1 text-sm text-slate-700">{team.rationale}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {team.riskFlags.length ? (
            team.riskFlags.map((risk) => <RiskBadge key={risk.code} risk={risk} />)
          ) : (
            <Badge variant="success">No critical risk flags</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/teams/${team.id}`} className={buttonVariants({ className: "w-full" })}>
          Open Team Detail
        </Link>
      </CardFooter>
    </Card>
  );
}
