import { StudentQuestionnaireForm } from "@/components/student/questionnaire-form";

export default function StudentQuestionnairePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Student Questionnaire</h1>
        <p className="text-sm text-muted-foreground">
          Share deeper context about workload, goals, and collaboration style for richer AI
          profile generation.
        </p>
      </div>
      <StudentQuestionnaireForm />
    </div>
  );
}
