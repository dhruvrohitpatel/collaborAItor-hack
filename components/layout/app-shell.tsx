import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AuthStatus } from "@/components/layout/auth-status";
import { NavLinks } from "@/components/layout/nav-links";
import { getOptionalSessionUser } from "@/lib/auth/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getOptionalSessionUser();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="rounded-full border border-[rgba(0,153,255,0.2)] bg-[rgba(255,255,255,0.08)] p-2 text-[#0099ff] shadow-[0_0_0_1px_rgba(0,153,255,0.15)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="[font-family:var(--font-display)] text-base font-medium tracking-[-0.04em]">
                  Collabor-AI-tor
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                  Google Track MVP
                </p>
              </div>
            </Link>
            <NavLinks role={user?.role ?? null} authenticated={Boolean(user)} />
          </div>
          <AuthStatus user={user} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:py-12">{children}</main>
    </div>
  );
}
