import Link from "next/link";

import { ProfileCard } from "@/components/student/profile-card";
import { buttonVariants } from "@/components/ui/button";
import { getDemoState } from "@/lib/repo";

export default async function ProfileReviewPage() {
  const state = await getDemoState();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Student Profile Review</h1>
          <p className="text-sm text-muted-foreground">
            Review generated collaboration profiles before finalizing team assignments.
          </p>
        </div>
        <Link href="/instructor" className={buttonVariants({ variant: "outline" })}>
          Go to Instructor Actions
        </Link>
      </div>

      {state.profiles.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <p className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
          No profiles generated yet. Use &quot;Generate Profiles&quot; from Instructor Dashboard.
        </p>
      )}
    </div>
  );
}
