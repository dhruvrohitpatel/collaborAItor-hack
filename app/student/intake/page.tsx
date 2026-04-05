import { StudentIntakeForm } from "@/components/student/intake-form";

export default function StudentIntakePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Student Intake</h1>
        <p className="text-sm text-muted-foreground">
          Capture collaboration preferences and project-working context.
        </p>
      </div>
      <StudentIntakeForm />
    </div>
  );
}
