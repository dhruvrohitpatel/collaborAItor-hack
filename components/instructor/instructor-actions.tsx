"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function InstructorActions() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState("4");
  const { push } = useToast();
  const router = useRouter();

  async function runAction(action: "seed" | "profiles" | "teams") {
    setLoadingAction(action);
    try {
      const response = await fetch(
        action === "seed"
          ? "/api/demo/seed"
          : action === "profiles"
            ? "/api/demo/generate-profiles"
            : "/api/demo/generate-teams",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: action === "teams" ? JSON.stringify({ teamSize: Number(teamSize) || 4 }) : "{}"
        }
      );

      if (!response.ok) {
        throw new Error(`Failed ${action}`);
      }

      const data = (await response.json()) as {
        warning?: string | null;
        providerUsed?: "gemini" | "mixed" | "mock";
        geminiProfilesCount?: number;
        mockProfilesCount?: number;
        rateLimited?: boolean;
      };

      push({
        kind: "success",
        title:
          action === "seed"
            ? "Demo seed loaded"
            : action === "profiles"
              ? "Profiles generated"
              : "Teams generated",
        description:
          action === "profiles"
            ? data.warning ??
              (typeof data.geminiProfilesCount === "number" &&
              typeof data.mockProfilesCount === "number"
                ? `${data.geminiProfilesCount} Gemini, ${data.mockProfilesCount} mock. Provider: ${data.providerUsed ?? "unknown"}.`
                : undefined)
            : undefined
      });

      router.refresh();
    } catch (error) {
      push({
        kind: "error",
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        onClick={() => runAction("seed")}
        disabled={loadingAction !== null}
      >
        {loadingAction === "seed" ? "Loading Seed..." : "Load Demo Seed"}
      </Button>
      <Button onClick={() => runAction("profiles")} disabled={loadingAction !== null}>
        {loadingAction === "profiles" ? "Generating..." : "Generate Profiles"}
      </Button>
      <div className="flex items-center gap-2">
        <Input
          value={teamSize}
          onChange={(event) => setTeamSize(event.target.value)}
          className="w-16"
          aria-label="team-size"
        />
        <Button
          variant="outline"
          onClick={() => runAction("teams")}
          disabled={loadingAction !== null}
        >
          {loadingAction === "teams" ? "Generating..." : "Generate Teams"}
        </Button>
      </div>
    </div>
  );
}
