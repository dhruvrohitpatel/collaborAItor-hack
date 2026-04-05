import { requireStudentPage } from "@/lib/auth/guards";
import { StudentQuestionnaireForm } from "@/components/student/questionnaire-form";

export const dynamic = "force-dynamic";

export default async function StudentQuestionnairePage() {
  const user = await requireStudentPage();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Student Onboarding Questionnaire</h1>
        <p className="text-sm text-muted-foreground">
          This is the primary student onboarding path: share availability, workload context, and
          collaboration preferences for richer AI-generated collaboration profiles.
        </p>
      </div>
      <StudentQuestionnaireForm initialEmail={user.email} initialName={user.name ?? ""} />
    </div>
  );
}
