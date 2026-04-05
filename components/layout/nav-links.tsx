"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import type { AppRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const publicLinks = [{ href: "/", label: "Home" }] as const;
const instructorLinks = [
  { href: "/instructor", label: "Instructor" },
  { href: "/instructor/roster", label: "Roster Setup" },
  { href: "/student/profile-review", label: "Profiles" },
  { href: "/teams", label: "Teams" },
  { href: "/tools", label: "AI Tools" }
] as const;
const studentLinks = [
  { href: "/student/questionnaire", label: "Onboarding" },
  { href: "/my-team", label: "My Team" }
] as const;

export function NavLinks({ role, authenticated }: { role: AppRole | null; authenticated: boolean }) {
  const pathname = usePathname() ?? "";
  const links = [
    ...publicLinks,
    ...(role === "instructor" ? instructorLinks : []),
    ...(role === "student" ? studentLinks : []),
    ...(!authenticated ? [{ href: "/sign-in", label: "Sign In" } as const] : [])
  ];

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(`${link.href}/`));

        return (
          <Link
            key={link.href}
            href={link.href as Route}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
