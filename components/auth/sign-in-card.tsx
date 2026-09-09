"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";

export function SignInCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);

    try {
      const [{ signInWithPopup, signOut }, auth, provider] = await Promise.all([
        import("firebase/auth"),
        Promise.resolve(getFirebaseAuth()),
        Promise.resolve(getGoogleProvider())
      ]);

      if (!auth || !provider) {
        throw new Error("Firebase client auth is not configured.");
      }

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: { role?: "instructor" | "student" };
      };

      if (!response.ok || !payload.user?.role) {
        await signOut(auth).catch(() => undefined);
        throw new Error(payload.error ?? "Could not create a server session.");
      }

      router.replace((payload.user.role === "instructor" ? "/instructor" : "/my-team") as Route);
      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unknown sign-in error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg border-[rgba(0,153,255,0.15)] bg-[#090909] text-white">
      <CardHeader>
        <CardTitle>Sign In With Google</CardTitle>
        <CardDescription>
          Firebase handles identity. After sign-in, the app checks your allowlisted instructor or
          student role. Calendar access is a separate, optional permission requested only for
          scheduling features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={signIn} disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Continue With Google"}
        </Button>
        <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/68">
          <p className="font-medium text-white">OAuth demo path</p>
          <p className="mt-1">
            1. Google sign-in through Firebase. 2. Team access based on allowlisted email. 3.
            Optional Calendar consent only when you want invites and Meet links.
          </p>
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
