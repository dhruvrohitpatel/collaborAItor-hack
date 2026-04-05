import { DerivedDataAlert } from "@/components/shared/derived-data-alert";
import { InstructorActions } from "@/components/instructor/instructor-actions";
import { KpiCards } from "@/components/instructor/kpi-cards";
import { RosterTable } from "@/components/instructor/roster-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoState } from "@/lib/repo";

export default async function InstructorPage() {
  const state = await getDemoState();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Instructor Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Load demo data, generate profiles, and create transparent teams.
        </p>
      </div>

      <KpiCards
        students={state.students.length}
        profiles={state.profiles.length}
        teams={state.teams.length}
        updatedAt={state.updatedAt}
      />

      <DerivedDataAlert
        profilesStale={state.profilesStale}
        teamsStale={state.teamsStale}
      />

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <InstructorActions />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <RosterTable students={state.students} />
        </CardContent>
      </Card>
    </div>
  );
}
