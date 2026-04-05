import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KpiCardsProps = {
  students: number;
  profiles: number;
  teams: number;
  updatedAt: string;
};

export function KpiCards({ students, profiles, teams, updatedAt }: KpiCardsProps) {
  const items = [
    { label: "Students", value: students, hint: "Roster entries" },
    { label: "Profiles", value: profiles, hint: "Generated summaries" },
    { label: "Teams", value: teams, hint: "Current assignments" }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
      <Card className="md:col-span-3">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Last updated</p>
          <p className="text-sm font-medium">{updatedAt ? new Date(updatedAt).toLocaleString() : "N/A"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
