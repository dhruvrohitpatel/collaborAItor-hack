import { StudentQuestionnaireForm } from "@/components/student/questionnaire-form";

export default function StudentQuestionnairePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Student Onboarding Questionnaire</h1>
        <p className="text-sm text-muted-foreground">
          This is the primary student onboarding path: share availability, workload context, and
          collaboration preferences for richer AI-generated collaboration profiles.
        </p>
      </div>
      <StudentQuestionnaireForm />
    </div>
  );
}
