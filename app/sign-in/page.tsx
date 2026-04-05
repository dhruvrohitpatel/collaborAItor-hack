import { redirect } from "next/navigation";

import { SignInCard } from "@/components/auth/sign-in-card";
import { getOptionalSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const user = await getOptionalSessionUser();

  if (user) {
    redirect(user.role === "instructor" ? "/instructor" : "/my-team");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Collabor-AI-tor Login</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Sign in with an allowlisted Google account. Student logins land on their team workspace, and instructor logins unlock roster and team management.
        </p>
      </div>
      <SignInCard />
    </div>
  );
}
