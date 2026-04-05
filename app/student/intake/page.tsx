import Link from "next/link";
import type { Route } from "next";

import { buttonVariants } from "@/components/ui/button";

export default function StudentIntakePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Legacy Intake</h1>
        <p className="text-sm text-muted-foreground">
          The richer questionnaire is now the primary onboarding path. This older intake flow is
          kept only as a temporary fallback during the transition.
        </p>
        <div className="pt-2">
          <Link href={"/student/questionnaire" as Route} className={buttonVariants({ variant: "outline" })}>
            Go To Student Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}
