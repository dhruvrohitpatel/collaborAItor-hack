import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentProfile } from "@/types/domain";

// ─── Color maps ───────────────────────────────────────────────────────────────

const leadershipConfig = {
  high: {
    label: "High leadership",
    className: "bg-violet-100 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  medium: {
    label: "Medium leadership",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
  emerging: {
    label: "Emerging",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const severityConfig = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

// Tag color cycling — gives visual texture without encoding meaning
const TAG_COLORS = [
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-orange-100 text-orange-700 border-orange-200",
];

function tagColor(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileCard({ profile }: { profile: StudentProfile }) {
  const leadership = leadershipConfig[profile.leadershipSignal as keyof typeof leadershipConfig]
    ?? leadershipConfig.emerging;

  const hasRiskFlags = profile.riskFlags && profile.riskFlags.length > 0;

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0">

      {/* Colored top stripe based on leadership */}
      <div className={`h-1 w-full ${leadership.dot}`} />

      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{profile.name}</span>
          <Badge
            variant={profile.profileSource === "ai" ? "success" : "secondary"}
            className="text-xs"
          >
            {profile.profileSource}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4 text-sm flex-1">

        {/* Summary */}
        <p className="text-slate-600 leading-relaxed text-xs">{profile.profileSummary}</p>

        {/* Tags */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.inferredTags.map((tag, i) => (
              <span
                key={tag}
                className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${tagColor(i)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Leadership signal */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Leadership</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${leadership.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${leadership.dot}`} />
            {leadership.label}
          </span>
        </div>

        {/* Risk flags */}
        {hasRiskFlags && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Risk flags</p>
            <div className="space-y-1.5">
              {profile.riskFlags.map((flag) => (
                <div
                  key={flag.code}
                  className={`rounded-lg border px-3 py-2 text-xs ${severityConfig[flag.severity as keyof typeof severityConfig] ?? severityConfig.low}`}
                >
                  <span className="font-semibold">{flag.label}</span>
                  {flag.note && (
                    <span className="ml-1 opacity-80">— {flag.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}