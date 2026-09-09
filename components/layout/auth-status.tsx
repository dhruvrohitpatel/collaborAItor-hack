"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/types";
import { getFirebaseAuth } from "@/lib/firebase";

export function AuthStatus({ user }: { user: SessionUser | null }) {
  const router = useRouter();

  if (!user) {
    return (
      <Link
        href={"/sign-in" as Route}
        className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/14"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Badge variant={user.role === "instructor" ? "secondary" : "success"}>
        {user.role === "instructor" ? (
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
        ) : (
          <UserRound className="mr-1 h-3.5 w-3.5" />
        )}
        {user.role}
      </Badge>
      <div className="text-right text-xs leading-tight text-white/58">
        <p className="font-medium text-white">{user.name ?? user.email}</p>
        <p>{user.email}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
          const auth = getFirebaseAuth();
          if (auth) {
            const { signOut } = await import("firebase/auth");
            await signOut(auth).catch(() => undefined);
          }
          router.replace("/sign-in" as Route);
          router.refresh();
        }}
      >
        <LogOut className="mr-1 h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );
}
