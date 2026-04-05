import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AICoachingResponse } from "@/lib/ai/schemas";
import type { StudentProfile } from "@/types/domain";

type DisengagementPanelProps = {
  teamId: string;
  members: StudentProfile[];
};

async function fetchCoachingData(
  teamId: string,
  members: StudentProfile[]
): Promise<AICoachingResponse | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/ai/coaching/disengagement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        members: members.map((m) => ({ id: m.id, name: m.name })),
        messages: [] // empty → falls back to seed data in demo mode
      }),
      cache: "no-store"
    });
    if (!res.ok) return null;
    return (await res.json()) as AICoachingResponse;
  } catch {
    return null;
  }
}

const severityStyles = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800"
};

const severityLabel = {
  high: "Needs attention",
  medium: "Worth monitoring",
  low: "Low signal"
};

export async function DisengagementPanel({ teamId, members }: DisengagementPanelProps) {
  const data = await fetchCoachingData(teamId, members);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          Participation Signals
          <span className="text-xs font-normal text-muted-foreground">Last 7 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">

        {/* Participation bar chart */}
        <div className="space-y-2">
          {(data?.participationSummary ?? []).map((member) => (
            <div key={member.memberName} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{member.memberName}</span>
                <span className="text-muted-foreground">
                  {member.messageCount} msg · {member.sharePercent}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-slate-500"
                  style={{ width: `${Math.min(member.sharePercent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {data?.hasAlert ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Instructor flags
            </p>
            {data.alerts.map((alert) => (
              <div
                key={alert.memberId}
                className={`rounded-md border px-3 py-2 text-xs ${severityStyles[alert.severity]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.flaggedMember}</span>
                  <span className="opacity-75">{severityLabel[alert.severity]}</span>
                </div>
                <p className="mt-1 opacity-90">{alert.reason}</p>
                <p className="mt-1 font-medium">Suggested: {alert.suggestedFollowUp}</p>
              </div>
            ))}
          </div>
        ) : (
          data && (
            <p className="text-xs text-muted-foreground">
              No participation concerns detected this week.
            </p>
          )
        )}

        {!data && (
          <p className="text-xs text-muted-foreground">Participation data unavailable.</p>
        )}
      </CardContent>
    </Card>
  );
}
