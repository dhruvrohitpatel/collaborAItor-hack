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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { DestinationFullResolution, MoveStudentResponse, Team } from "@/types/domain";

// ─── Color helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return { bar: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (score >= 50) return { bar: "bg-blue-400",    badge: "bg-blue-100 text-blue-700 border-blue-200" };
  if (score >= 35) return { bar: "bg-amber-400",   badge: "bg-amber-100 text-amber-700 border-amber-200" };
  return             { bar: "bg-red-400",     badge: "bg-red-100 text-red-700 border-red-200" };
}

// Role color cycling so each member is visually distinct
const ROLE_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-teal-100 text-teal-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function roleColor(index: number) {
  return ROLE_COLORS[index % ROLE_COLORS.length];
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamCardProps = { team: Team; teams: Team[] };

function formatDelta(value: number) {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    () => teams.filter((c) => c.id !== team.id),
    [team.id, teams]
  );
  const selectedDestination = destinationTeams.find((c) => c.id === destinationTeamId);
  const destinationIsFull = selectedDestination !== undefined && selectedDestination.members.length >= MAX_TEAM_SIZE;
  const teamIsOutOfBounds = team.riskFlags.some(
    (r) => r.code === "team_size_over_max" || r.code === "team_size_under_min"
  );

  const score = Math.round(team.scoreSummary.total);
  const colors = scoreColor(score);

  function resetMoveState() {
    setDestinationTeamId(""); setFullResolution(null);
    setAnalysisLoading(false); setMoveLoading(false);
    setDisplacedStudentId(""); setRerouteTeamId("");
  }

  async function sendMoveRequest(body: Record<string, string>) {
    const response = await fetch("/api/demo/move-student", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = (await response.json().catch(() => ({}))) as MoveStudentResponse;
    return { response, payload };
  }

  const analyzeFullDestination = useCallback(async (nextDestinationTeamId: string) => {
    if (!selectedStudentId || !nextDestinationTeamId || sourceTooSmallToMove) {
      setFullResolution(null); return;
    }
    setAnalysisLoading(true);
    try {
      const { payload } = await sendMoveRequest({
        action: "analyze_move", studentId: selectedStudentId,
        fromTeamId: team.id, toTeamId: nextDestinationTeamId
      });
      if (payload.ok && payload.status === "destination_full") {
        setFullResolution(payload.resolution);
        setDisplacedStudentId(payload.resolution.destinationMembers[0]?.studentId ?? "");
        setRerouteTeamId(payload.resolution.rerouteTargets[0]?.teamId ?? "");
        return;
      }
      setFullResolution(null);
    } catch { setFullResolution(null); }
    finally { setAnalysisLoading(false); }
  }, [selectedStudentId, sourceTooSmallToMove, team.id]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (!destinationTeamId || !destinationIsFull) {
      setFullResolution(null); setDisplacedStudentId(""); setRerouteTeamId(""); return;
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
      if (!response.ok || !payload.ok) throw new Error(payload.ok ? "Move failed" : payload.error);
      push({ kind: "success", title: "Team updated", description: successDescription });
      setDialogOpen(false); resetMoveState(); router.refresh();
    } catch (error) {
      push({ kind: "error", title: "Move failed", description: error instanceof Error ? error.message : "Unknown error" });
    } finally { setMoveLoading(false); }
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden p-0">

      {/* Score color stripe at top */}
      <div className={`h-1.5 w-full ${colors.bar}`} />

      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{team.id}</span>
            {teamIsOutOfBounds && <Badge variant="danger">Out of bounds</Badge>}
          </div>
          {/* Color-coded score badge */}
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
            Score {score}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4 flex-1">

        {/* Members with role color chips */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Members</p>
          <ul className="space-y-1.5">
            {team.members.map((member, i) => (
              <li key={member.id} className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{member.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColor(i)}`}>
                  {member.preferredRole}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rationale */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Rationale</p>
          <p className="text-xs text-slate-600 leading-relaxed">{team.rationale}</p>
        </div>

        {/* Score breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Team score</p>
              <p className="mt-1 text-xs text-slate-500">
                View how coverage, overlap, balance, growth fit, and risk penalty drive this team score.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowScoreDetails((c) => !c)}>
              {showScoreDetails ? "Hide" : "View details"}
            </Button>
          </div>
          {showScoreDetails && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <ScoreSummary score={team.scoreSummary} variant="inline" />
            </div>
          )}
        </div>

        {/* Risk flags */}
        <div className="flex flex-wrap gap-2">
          {team.riskFlags.length ? (
            team.riskFlags.map((risk) => <RiskBadge key={risk.code} risk={risk} />)
          ) : (
            <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              No critical risk flags
            </span>
          )}
        </div>

      </CardContent>

      <CardFooter className="flex flex-col gap-2 px-4 pb-4">
        {/* Move student dialog — logic unchanged */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetMoveState(); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">Move student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Move student from {team.id}</DialogTitle>
              <DialogDescription>
                Instructor overrides re-score the roster immediately. If the destination team is full,
                you can accept a suggested swap, reroute a destination member, or force the move.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Student</p>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                    <SelectContent>
                      {team.members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Destination team</p>
                  <Select value={destinationTeamId} onValueChange={setDestinationTeamId}>
                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      {destinationTeams.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.id} ({c.members.length} members{c.members.length >= MAX_TEAM_SIZE ? ", full" : ""})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md bg-slate-50 p-3 text-xs text-muted-foreground">
                <p>Current team size: {team.members.length}. Standard moves keep teams within {MIN_TEAM_SIZE} to {MAX_TEAM_SIZE} members.</p>
                {sourceTooSmallToMove && (
                  <p className="mt-2 text-rose-600">This team is at minimum size and cannot move members out.</p>
                )}
              </div>

              {destinationIsFull && (
                <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900">{selectedDestination?.id} is full at {selectedDestination?.members.length} members.</p>
                    <p className="text-sm text-amber-900/80">Choose a fallback: suggested swap, manual reroute, or instructor override.</p>
                  </div>
                  {analysisLoading && <p className="text-sm text-muted-foreground">Analyzing best recovery options...</p>}
                  {!analysisLoading && fullResolution && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Suggested swaps</p>
                        {fullResolution.suggestedSwaps.length ? (
                          <div className="space-y-2">
                            {fullResolution.suggestedSwaps.map((s, i) => (
                              <div key={s.displacedStudentId} className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Option {i + 1}: swap with {s.displacedStudentName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {s.displacedStudentRole} returns to {team.id}. Source {formatDelta(s.sourceTeamScoreDelta)}, destination {formatDelta(s.destinationTeamScoreDelta)}, fairness {formatDelta(s.fairnessDelta)}.
                                    </p>
                                  </div>
                                  <Button size="sm" variant="outline" disabled={moveLoading || sourceTooSmallToMove}
                                    onClick={() => void finalizeMove({ action: "swap_move", studentId: selectedStudentId, fromTeamId: team.id, toTeamId: destinationTeamId, displacedStudentId: s.displacedStudentId }, "Applied a suggested swap.")}>
                                    Apply swap
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No strong swap candidates found. Use manual reroute or override.</p>
                        )}
                      </div>

                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Manual reroute</p>
                          <p className="text-xs text-muted-foreground">Choose a destination-team student to move out and pick where they go.</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Displaced student</p>
                            <Select value={displacedStudentId} onValueChange={setDisplacedStudentId}>
                              <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                              <SelectContent>
                                {fullResolution.destinationMembers.map((m) => (
                                  <SelectItem key={m.studentId} value={m.studentId}>{m.studentName} ({m.preferredRole})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reroute team</p>
                            <Select value={rerouteTeamId} onValueChange={setRerouteTeamId}>
                              <SelectTrigger><SelectValue placeholder="Choose team" /></SelectTrigger>
                              <SelectContent>
                                {fullResolution.rerouteTargets.map((t) => (
                                  <SelectItem key={t.teamId} value={t.teamId}>{t.teamName} ({t.memberCount} members)</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button variant="outline" disabled={moveLoading || !displacedStudentId || !rerouteTeamId}
                          onClick={() => void finalizeMove({ action: "reroute_move", studentId: selectedStudentId, fromTeamId: team.id, toTeamId: destinationTeamId, displacedStudentId, rerouteTeamId }, "Applied the move and rerouted the displaced student.")}>
                          Apply reroute
                        </Button>
                      </div>

                      <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                        <p className="text-sm font-medium text-rose-700">Instructor override</p>
                        <p className="text-xs text-rose-700/90 mt-0.5">Force the move even though the destination will exceed max size. The team will be marked out of bounds.</p>
                        <Button className="mt-3" variant="destructive" disabled={moveLoading || sourceTooSmallToMove}
                          onClick={() => void finalizeMove({ action: "force_override_move", studentId: selectedStudentId, fromTeamId: team.id, toTeamId: destinationTeamId }, "Forced the move and marked the destination as out of bounds.")}>
                          Force override
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => void finalizeMove({ action: "simple_move", studentId: selectedStudentId, fromTeamId: team.id, toTeamId: destinationTeamId }, "Moved the student and recalculated team scores.")}
                disabled={moveLoading || analysisLoading || sourceTooSmallToMove || !selectedStudentId || !destinationTeamId || destinationIsFull}>
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