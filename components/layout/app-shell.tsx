import Link from "next/link";
import { Sparkles } from "lucide-react";

import { MockAuthToggle } from "@/components/layout/mock-auth-toggle";
import { NavLinks } from "@/components/layout/nav-links";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="rounded-md bg-primary/10 p-1.5 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">Collabor-AI-tor</p>
                <p className="text-xs text-muted-foreground">Google Track MVP</p>
              </div>
            </Link>
            <NavLinks />
          </div>
          <MockAuthToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
