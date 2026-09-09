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
              "rounded-full px-3.5 py-2 text-sm font-medium tracking-[-0.01em] transition",
              active
                ? "border border-[rgba(0,153,255,0.2)] bg-[rgba(0,153,255,0.14)] text-white shadow-[0_0_0_1px_rgba(0,153,255,0.15)]"
                : "text-white/68 hover:bg-white/8 hover:text-white"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
