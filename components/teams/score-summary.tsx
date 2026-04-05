import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TeamScoreBreakdown } from "@/types/domain";

const scoreRows = [
  {
    key: "skillDiversity",
    label: "Skill coverage",
    description: "Broader capability coverage raises this score."
  },
  {
    key: "availabilityOverlap",
    label: "Availability overlap",
    description: "More shared working time raises this score."
  },
  {
    key: "communicationBalance",
    label: "Communication balance",
    description: "A healthier mix of collaboration styles raises this score."
  },
  {
    key: "leadershipDistribution",
    label: "Leadership balance",
    description: "Facilitation coverage without over-concentration raises this score."
  },
  {
    key: "growthOpportunityFit",
    label: "Growth fit",
    description: "Teammates whose strengths support others' growth goals raise this score."
  }
] satisfies Array<{
  key: keyof Omit<TeamScoreBreakdown, "total" | "riskPenalty">;
  label: string;
  description: string;
}>;

type ScoreSummaryProps = {
  score: TeamScoreBreakdown;
  variant?: "card" | "inline";
};

function ScoreSummaryBody({ score }: { score: TeamScoreBreakdown }) {
  return (
    <div className="space-y-3">
      {scoreRows.map((row) => (
        <div key={row.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{row.label}</span>
            <span>{score[row.key]}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full bg-primary")}
              style={{ width: `${Math.max(0, Math.min(100, score[row.key]))}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{row.description}</p>
        </div>
      ))}
      <div className="rounded-md bg-slate-50 p-2 text-sm">
        <p>
          Total: <span className="font-semibold">{score.total}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Risk penalty: {score.riskPenalty}. More flagged risks push the total down.
        </p>
      </div>
    </div>
  );
}

export function ScoreSummary({ score, variant = "card" }: ScoreSummaryProps) {
  if (variant === "inline") {
    return <ScoreSummaryBody score={score} />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Score Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ScoreSummaryBody score={score} />
      </CardContent>
    </Card>
  );
}
