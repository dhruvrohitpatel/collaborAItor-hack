import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TeamScoreBreakdown } from "@/types/domain";

const scoreRows: Array<keyof Omit<TeamScoreBreakdown, "total" | "riskPenalty">> = [
  "skillDiversity",
  "availabilityOverlap",
  "communicationBalance",
  "leadershipDistribution",
  "growthOpportunityFit"
];

export function ScoreSummary({ score }: { score: TeamScoreBreakdown }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Score Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scoreRows.map((key) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{key}</span>
              <span>{score[key]}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full bg-primary")}
                style={{ width: `${Math.max(0, Math.min(100, score[key]))}%` }}
              />
            </div>
          </div>
        ))}
        <div className="rounded-md bg-slate-50 p-2 text-sm">
          <p>
            Total: <span className="font-semibold">{score.total}</span>
          </p>
          <p className="text-xs text-muted-foreground">Risk penalty: {score.riskPenalty}</p>
        </div>
      </CardContent>
    </Card>
  );
}
