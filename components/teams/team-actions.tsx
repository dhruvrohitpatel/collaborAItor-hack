"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function TeamActions() {
  const [teamSize, setTeamSize] = useState("4");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { push } = useToast();

  return (
    <div className="flex items-center gap-2">
      <Input
        className="w-20"
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
              body: JSON.stringify({ teamSize: Number(teamSize) || 4 })
            });

            if (!response.ok) throw new Error("Could not generate teams");

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
  );
}
