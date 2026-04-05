import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentProfile } from "@/types/domain";

export function ProfileCard({ profile }: { profile: StudentProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          {profile.name}
          <Badge variant={profile.profileSource === "ai" ? "success" : "secondary"}>
            {profile.profileSource}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{profile.profileSummary}</p>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {profile.inferredTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Leadership signal: <span className="font-medium text-slate-700">{profile.leadershipSignal}</span>
        </p>
      </CardContent>
    </Card>
  );
}
