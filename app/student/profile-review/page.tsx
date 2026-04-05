import { DerivedDataAlert } from "@/components/shared/derived-data-alert";
import Link from "next/link";

import { ProfileCard } from "@/components/student/profile-card";
import { buttonVariants } from "@/components/ui/button";
import { getDemoState } from "@/lib/repo";

export default async function ProfileReviewPage() {
  const state = await getDemoState();
  const aiProfiles = state.profiles.filter((profile) => profile.profileSource === "ai").length;
  const mockProfiles = state.profiles.filter((profile) => profile.profileSource === "mock").length;

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

      <DerivedDataAlert
        profilesStale={state.profilesStale}
        teamsStale={state.teamsStale}
      />

      {state.profiles.length > 0 && mockProfiles > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">
            {aiProfiles > 0 ? "Profile generation used mixed providers." : "Profile generation used mock fallback."}
          </p>
          <p className="mt-1 text-amber-800">
            {aiProfiles > 0
              ? `${aiProfiles} Gemini and ${mockProfiles} mock profiles are shown. This usually means Gemini rate-limited or one batch failed validation.`
              : `${mockProfiles} mock profiles are shown. This usually means Gemini was unavailable, rate-limited, or mock mode is enabled.`}
          </p>
        </div>
      ) : null}

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
