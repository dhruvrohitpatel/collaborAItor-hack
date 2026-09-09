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
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="framer-kicker">Access</p>
        <h1 className="max-w-3xl text-5xl font-medium leading-none tracking-[-0.07em] md:text-7xl">
          Collabor-AI-tor login
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Sign in with an allowlisted Google account. Student logins land on their team workspace, and instructor logins unlock roster and team management.
        </p>
      </div>
      <SignInCard />
    </div>
  );
}
