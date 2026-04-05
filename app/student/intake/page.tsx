import Link from "next/link";
import type { Route } from "next";

import { StudentIntakeForm } from "@/components/student/intake-form";
import { buttonVariants } from "@/components/ui/button";

export default function StudentIntakePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Student Intake</h1>
        <p className="text-sm text-muted-foreground">
          Capture collaboration preferences and project-working context.
        </p>
        <div className="pt-2">
          <Link href={"/student/questionnaire" as Route} className={buttonVariants({ variant: "outline" })}>
            Try New Questionnaire
          </Link>
        </div>
      </div>
      <StudentIntakeForm />
    </div>
  );
}
