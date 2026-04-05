import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentStudentTeam } from "@/lib/auth/guards";
import { getStudentByEmail } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function MyTeamPage() {
  const { user, team } = await requireCurrentStudentTeam();
  const student = await getStudentByEmail(user.email);

  if (team) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">My Team</h1>
          <p className="text-sm text-muted-foreground">
            Your team assignment is ready. Enter the workspace to use the copilot and collaboration tools.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{team.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{team.rationale}</p>
            <Link href={`/teams/${team.id}`} className={buttonVariants({})}>
              Open Team Workspace
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Team</h1>
        <p className="text-sm text-muted-foreground">
          {student
            ? "Your onboarding record exists, but an instructor has not assigned your team yet."
            : "Start with onboarding so instructors can generate your profile and place you into a team."}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{student ? "Waiting for team assignment" : "Complete onboarding first"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            {student
              ? "Once teams are generated, this page will redirect straight into your team workspace."
              : "Your signed-in email is allowlisted, but you still need to submit your onboarding questionnaire."}
          </p>
          <Link href="/student/questionnaire" className={buttonVariants({ variant: "outline" })}>
            Open Student Onboarding
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
