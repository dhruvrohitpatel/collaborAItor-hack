"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "@/lib/config";
import { RiskBadge } from "@/components/teams/risk-badge";
import { ScoreSummary } from "@/components/teams/score-summary";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { DestinationFullResolution, MoveStudentResponse, Team } from "@/types/domain";

type TeamCardProps = {
  team: Team;
  teams: Team[];
};

function formatDelta(value: number) {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

export function TeamCard({ team, teams }: TeamCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(team.members[0]?.id ?? "");
  const [destinationTeamId, setDestinationTeamId] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [fullResolution, setFullResolution] = useState<DestinationFullResolution | null>(null);
  const [displacedStudentId, setDisplacedStudentId] = useState("");
  const [rerouteTeamId, setRerouteTeamId] = useState("");
  const router = useRouter();
  const { push } = useToast();

  const sourceTooSmallToMove = team.members.length <= MIN_TEAM_SIZE;
  const destinationTeams = useMemo(
    () => teams.filter((candidate) => candidate.id !== team.id),
    [team.id, teams]
  );
  const selectedDestination = destinationTeams.find(
    (candidate) => candidate.id === destinationTeamId
  );
  const destinationIsFull =
    selectedDestination !== undefined && selectedDestination.members.length >= MAX_TEAM_SIZE;
  const teamIsOutOfBounds = team.riskFlags.some(
    (risk) => risk.code === "team_size_over_max" || risk.code === "team_size_under_min"
  );

  function resetMoveState() {
    setDestinationTeamId("");
    setFullResolution(null);
    setAnalysisLoading(false);
    setMoveLoading(false);
    setDisplacedStudentId("");
    setRerouteTeamId("");
  }

  async function sendMoveRequest(body: Record<string, string>) {
    const response = await fetch("/api/demo/move-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const payload = (await response.json().catch(() => ({}))) as MoveStudentResponse;
    return { response, payload };
  }

  const analyzeFullDestination = useCallback(async (nextDestinationTeamId: string) => {
    if (!selectedStudentId || !nextDestinationTeamId || sourceTooSmallToMove) {
      setFullResolution(null);
      return;
    }

    setAnalysisLoading(true);
    try {
      const { payload } = await sendMoveRequest({
        action: "analyze_move",
        studentId: selectedStudentId,
        fromTeamId: team.id,
        toTeamId: nextDestinationTeamId
      });

      if (payload.ok && payload.status === "destination_full") {
        setFullResolution(payload.resolution);
        setDisplacedStudentId(payload.resolution.destinationMembers[0]?.studentId ?? "");
        setRerouteTeamId(payload.resolution.rerouteTargets[0]?.teamId ?? "");
        return;
      }

      setFullResolution(null);
    } catch {
      setFullResolution(null);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedStudentId, sourceTooSmallToMove, team.id]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (!destinationTeamId || !destinationIsFull) {
      setFullResolution(null);
      setDisplacedStudentId("");
      setRerouteTeamId("");
      return;
    }

    void analyzeFullDestination(destinationTeamId);
  }, [analyzeFullDestination, destinationIsFull, destinationTeamId, dialogOpen]);

  async function finalizeMove(body: Record<string, string>, successDescription: string) {
    setMoveLoading(true);
    try {
      const { response, payload } = await sendMoveRequest(body);

      if (payload.ok && payload.status === "destination_full") {
        setFullResolution(payload.resolution);
        setDisplacedStudentId(payload.resolution.destinationMembers[0]?.studentId ?? "");
        setRerouteTeamId(payload.resolution.rerouteTargets[0]?.teamId ?? "");
        return;
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Move failed" : payload.error);
      }

      push({
        kind: "success",
        title: "Team updated",
        description: successDescription
      });
      setDialogOpen(false);
      resetMoveState();
      router.refresh();
    } catch (error) {
      push({
        kind: "error",
        title: "Move failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setMoveLoading(false);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <div className="flex items-center gap-2">
            <span>{team.id}</span>
            {teamIsOutOfBounds ? <Badge variant="danger">Out of bounds</Badge> : null}
          </div>
          <Badge variant="success">Score {team.scoreSummary.total}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Members</p>
          <ul className="mt-1 space-y-1 text-sm">
            {team.members.map((member) => (
              <li key={member.id}>
                {member.name} <span className="text-xs text-muted-foreground">({member.preferredRole})</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rationale</p>
          <p className="mt-1 text-sm text-slate-700">{team.rationale}</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Team score
              </p>
              <p className="mt-1 text-sm text-slate-700">
                View how coverage, overlap, balance, growth fit, and risk penalty drive this team
                score.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScoreDetails((current) => !current)}
            >
              {showScoreDetails ? "Hide details" : "View details"}
            </Button>
          </div>

          {showScoreDetails ? (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <ScoreSummary score={team.scoreSummary} variant="inline" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {team.riskFlags.length ? (
            team.riskFlags.map((risk) => <RiskBadge key={risk.code} risk={risk} />)
          ) : (
            <Badge variant="success">No critical risk flags</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetMoveState();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Move student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Move student from {team.id}</DialogTitle>
              <DialogDescription>
                Instructor overrides re-score the roster immediately. If the destination team is
                full, you can accept a suggested swap, reroute a destination member, or force the
                move and leave the team temporarily over the max size.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Student</p>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {team.members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Destination team</p>
                  <Select value={destinationTeamId} onValueChange={setDestinationTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a destination team" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationTeams.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.id} ({candidate.members.length} members
                          {candidate.members.length >= MAX_TEAM_SIZE ? ", full" : ""})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md bg-slate-50 p-3 text-xs text-muted-foreground">
                <p>
                  Current team size: {team.members.length}. Standard moves keep teams within the{" "}
                  {MIN_TEAM_SIZE} to {MAX_TEAM_SIZE} member range.
                </p>
                {sourceTooSmallToMove ? (
                  <p className="mt-2 text-rose-600">
                    This team is already at the minimum size and cannot move members out.
                  </p>
                ) : null}
              </div>

              {destinationIsFull ? (
                <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900">
                      {selectedDestination?.id} is full at {selectedDestination?.members.length} members.
                    </p>
                    <p className="text-sm text-amber-900/80">
                      Choose a fallback path: suggested swap, manual reroute, or explicit instructor
                      override.
                    </p>
                  </div>

                  {analysisLoading ? (
                    <p className="text-sm text-muted-foreground">Analyzing best recovery options...</p>
                  ) : null}

                  {!analysisLoading && fullResolution ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Suggested swaps</p>
                        {fullResolution.suggestedSwaps.length ? (
                          <div className="space-y-2">
                            {fullResolution.suggestedSwaps.map((suggestion, index) => (
                              <div
                                key={suggestion.displacedStudentId}
                                className="rounded-md border border-slate-200 bg-white p-3"
                              >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                      Option {index + 1}: swap with {suggestion.displacedStudentName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {suggestion.displacedStudentRole} returns to {team.id}. Source
                                      score {formatDelta(suggestion.sourceTeamScoreDelta)},
                                      destination score {formatDelta(suggestion.destinationTeamScoreDelta)},
                                      fairness {formatDelta(suggestion.fairnessDelta)}.
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={moveLoading || sourceTooSmallToMove}
                                    onClick={() =>
                                      void finalizeMove(
                                        {
                                          action: "swap_move",
                                          studentId: selectedStudentId,
                                          fromTeamId: team.id,
                                          toTeamId: destinationTeamId,
                                          displacedStudentId: suggestion.displacedStudentId
                                        },
                                        "Applied a suggested swap and recalculated the roster."
                                      )
                                    }
                                  >
                                    Apply swap
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No strong swap candidates were found. Use manual reroute or override.
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Manual reroute</p>
                          <p className="text-xs text-muted-foreground">
                            Choose a destination-team student to move out and pick where they should
                            go.
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Displaced student
                            </p>
                            <Select value={displacedStudentId} onValueChange={setDisplacedStudentId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose destination student" />
                              </SelectTrigger>
                              <SelectContent>
                                {fullResolution.destinationMembers.map((member) => (
                                  <SelectItem key={member.studentId} value={member.studentId}>
                                    {member.studentName} ({member.preferredRole})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Reroute team
                            </p>
                            <Select value={rerouteTeamId} onValueChange={setRerouteTeamId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose reroute team" />
                              </SelectTrigger>
                              <SelectContent>
                                {fullResolution.rerouteTargets.map((target) => (
                                  <SelectItem key={target.teamId} value={target.teamId}>
                                    {target.teamName} ({target.memberCount} members)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          disabled={moveLoading || !displacedStudentId || !rerouteTeamId}
                          onClick={() =>
                            void finalizeMove(
                              {
                                action: "reroute_move",
                                studentId: selectedStudentId,
                                fromTeamId: team.id,
                                toTeamId: destinationTeamId,
                                displacedStudentId,
                                rerouteTeamId
                              },
                              "Applied the move and rerouted the displaced student."
                            )
                          }
                        >
                          Apply reroute
                        </Button>
                      </div>

                      <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-rose-700">Instructor override</p>
                          <p className="text-xs text-rose-700/90">
                            Force the move even though the destination team will exceed the max size.
                            The team will be marked out of bounds until you repair it.
                          </p>
                        </div>
                        <Button
                          className="mt-3"
                          variant="destructive"
                          disabled={moveLoading || sourceTooSmallToMove}
                          onClick={() =>
                            void finalizeMove(
                              {
                                action: "force_override_move",
                                studentId: selectedStudentId,
                                fromTeamId: team.id,
                                toTeamId: destinationTeamId
                              },
                              "Forced the move and marked the destination team as out of bounds."
                            )
                          }
                        >
                          Force override
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                onClick={() =>
                  void finalizeMove(
                    {
                      action: "simple_move",
                      studentId: selectedStudentId,
                      fromTeamId: team.id,
                      toTeamId: destinationTeamId
                    },
                    "Moved the student and recalculated team scores."
                  )
                }
                disabled={
                  moveLoading ||
                  analysisLoading ||
                  sourceTooSmallToMove ||
                  !selectedStudentId ||
                  !destinationTeamId ||
                  destinationIsFull
                }
              >
                {moveLoading ? "Updating..." : "Apply move"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Link href={`/teams/${team.id}`} className={buttonVariants({ className: "w-full" })}>
          Open Team Detail
        </Link>
      </CardFooter>
    </Card>
  );
}
