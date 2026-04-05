"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DEFAULT_TEAM_SIZE, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function TeamActions() {
  const [teamSize, setTeamSize] = useState(String(DEFAULT_TEAM_SIZE));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { push } = useToast();

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          className="w-20"
          type="number"
          min={MIN_TEAM_SIZE}
          max={MAX_TEAM_SIZE}
          value={teamSize}
          onChange={(event) => setTeamSize(event.target.value)}
          aria-label="Team size"
        />
        <Button
          onClick={async () => {
            setLoading(true);
            try {
              const response = await fetch("/api/demo/generate-teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamSize: Number(teamSize) || DEFAULT_TEAM_SIZE })
              });

              const payload = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(payload.error ?? "Could not generate teams");

              push({ kind: "success", title: "Teams regenerated" });
              router.refresh();
            } catch (error) {
              push({
                kind: "error",
                title: "Generation failed",
                description: error instanceof Error ? error.message : "Unknown error"
              });
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Teams"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Team size: {MIN_TEAM_SIZE} to {MAX_TEAM_SIZE} students. Default {DEFAULT_TEAM_SIZE}.
      </p>
    </div>
  );
}
