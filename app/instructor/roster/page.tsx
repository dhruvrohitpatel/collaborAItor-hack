import { RosterSetupForm } from "@/components/instructor/roster-setup-form";
import { requireInstructorPage } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function InstructorRosterPage() {
  await requireInstructorPage();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Instructor Roster Setup</h1>
        <p className="text-sm text-muted-foreground">
          Add a lightweight roster first, then let students complete the richer questionnaire.
        </p>
      </div>
      <RosterSetupForm />
    </div>
  );
}
