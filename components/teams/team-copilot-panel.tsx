"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type {
  TeamCopilotExecuteResponse,
  TeamCopilotResponse
} from "@/lib/ai/schemas";
import type { AppRole } from "@/lib/auth/types";
import type { Team } from "@/types/domain";

type TeamCopilotPanelProps = {
  team: Team;
  viewerRole: AppRole;
  viewerEmail: string;
};

type CopilotIntent =
  | "rewrite_message"
  | "schedule_meeting"
  | "meeting_followup"
  | "weekly_pulse";

const intentLabels: Record<CopilotIntent, string> = {
  rewrite_message: "Rewrite Message",
  schedule_meeting: "Plan Meeting",
  meeting_followup: "Meeting Notes to Tasks",
  weekly_pulse: "Team Status Summary"
};

type GoogleConnectionStatus = {
  members: Array<{
    id: string;
    name: string;
    email: string;
    connected: boolean;
  }>;
  membersMissingGoogle: string[];
};

function formatTimestamp(value: string | null) {
  if (!value) return "Not yet";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function TeamCopilotPanel({
  team,
  viewerRole,
  viewerEmail
}: TeamCopilotPanelProps) {
  const router = useRouter();
  const { push } = useToast();
  const [preview, setPreview] = useState<TeamCopilotResponse | null>(null);
  const [executed, setExecuted] = useState<TeamCopilotExecuteResponse | null>(null);
  const [activeIntent, setActiveIntent] = useState<CopilotIntent | null>(null);
  const [loadingIntent, setLoadingIntent] = useState<CopilotIntent | null>(null);
  const [executing, setExecuting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleConnectionStatus | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [rewrite, setRewrite] = useState({
    message: "Can someone please finish their part? We are behind.",
    tone: "professional",
    audience: ""
  });
  const [meeting, setMeeting] = useState({
    durationMin: String(team.preferredMeetingDurationMin ?? 60),
    dateRangeStart: "",
    dateRangeEnd: "",
    createCalendarInvite: true,
    agenda: `${team.projectTheme} working session`
  });
  const [followup, setFollowup] = useState({
    meetingId: team.activeMeetingId ?? "",
    notes:
      "Reviewed milestone status. Alex will finalize the API routes. Mina will tighten the demo story. Need to decide when to do the final rehearsal."
  });
  const rewriteAudienceMissing = rewrite.audience.trim().length < 2;
  const rewriteMessageMissing = rewrite.message.trim().length < 5;
  const rewriteFormInvalid = rewriteAudienceMissing || rewriteMessageMissing;
  const isInstructor = viewerRole === "instructor";
  const selfStatus =
    googleStatus?.members.find((member) => member.email.toLowerCase() === viewerEmail.toLowerCase()) ??
    null;

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : `Request failed (${response.status}).`;
      throw new Error(message);
    }

    if (!payload) {
      throw new Error("Invalid API response.");
    }

    return payload as T;
  }

  async function loadGoogleStatus() {
    setGoogleLoading(true);
    try {
      const response = await fetch(
        `/api/google/connect/status?teamId=${encodeURIComponent(team.id)}`
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not fetch Google connection status.");
      }
      setGoogleStatus(payload as GoogleConnectionStatus);
    } catch (error) {
      push({
        kind: "error",
        title: "Google status unavailable",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  useEffect(() => {
    loadGoogleStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  async function requestPreview(intent: CopilotIntent, payload: unknown) {
    if (
      intent === "rewrite_message" &&
      typeof payload === "object" &&
      payload &&
      "audience" in payload &&
      typeof payload.audience === "string" &&
      payload.audience.trim().length < 2
    ) {
      push({
        kind: "error",
        title: "Audience is required",
        description: "Add who will read this message (for example: teammates, TA, professor)."
      });
      return;
    }

    setLoadingIntent(intent);
    setExecuted(null);

    try {
      const result = await postJson<TeamCopilotResponse>("/api/ai/team-copilot", {
        teamId: team.id,
        intent,
        payload
      });

      setPreview(result);
      setActiveIntent(intent);
      push({
        kind: "success",
        title: `${intentLabels[intent]} preview ready`
      });
      await loadGoogleStatus();
      router.refresh();
    } catch (error) {
      push({
        kind: "error",
        title: "Copilot request failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoadingIntent(null);
    }
  }

  async function executePreview() {
    if (!preview) return;

    setExecuting(true);

    try {
      const result = await postJson<TeamCopilotExecuteResponse>("/api/ai/team-copilot/execute", {
        teamId: team.id,
        runId: preview.runId,
        approved: true
      });

      setExecuted(result);
      push({
        kind: result.status === "executed" ? "success" : "error",
        title: result.status === "executed" ? "Copilot action saved" : "Copilot action failed"
      });
      await loadGoogleStatus();
      router.refresh();
    } catch (error) {
      push({
        kind: "error",
        title: "Execution failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setExecuting(false);
    }
  }

  async function startGoogleConnect() {
    if (isInstructor) {
      push({ kind: "error", title: "Students must connect their own Google accounts." });
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await postJson<{ oauthUrl: string }>("/api/google/connect/start", {
        teamId: team.id,
        returnTo: `/teams/${team.id}`
      });
      window.location.href = result.oauthUrl;
    } catch (error) {
      push({
        kind: "error",
        title: "Could not start Google connect",
        description: error instanceof Error ? error.message : "Unknown error"
      });
      setGoogleLoading(false);
    }
  }

  async function revokeGoogleConnect() {
    if (isInstructor) {
      push({ kind: "error", title: "Students must disconnect their own Google accounts." });
      return;
    }

    setGoogleLoading(true);
    try {
      await postJson<{ ok: true }>("/api/google/connect/revoke", {});
      push({
        kind: "success",
        title: "Google connection removed"
      });
      await loadGoogleStatus();
    } catch (error) {
      push({
        kind: "error",
        title: "Could not remove Google connection",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  const upcomingMeetingCount = team.meetings.filter(
    (item) => item.status === "proposed" || item.status === "scheduled"
  ).length;
  const openTaskCount = team.tasks.filter((task) => task.status !== "done").length;

  return (
    <div className="space-y-4">
      <Card className="border-sky-200 bg-sky-50/40">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Team Copilot</CardTitle>
            <Badge variant={team.aiOptIn ? "success" : "warning"}>
              {team.aiOptIn ? "AI enabled" : "AI disabled"}
            </Badge>
          </div>
          <CardDescription>
            One assistant, four bounded actions. It reads team state, previews a plan, and saves
            history after approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md border bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Open tasks</p>
            <p className="mt-1 text-lg font-semibold">{openTaskCount}</p>
          </div>
          <div className="rounded-md border bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Upcoming meetings</p>
            <p className="mt-1 text-lg font-semibold">{upcomingMeetingCount}</p>
          </div>
          <div className="rounded-md border bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Last summary</p>
            <p className="mt-1 text-sm font-semibold">{formatTimestamp(team.lastPulseAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Google Connections</CardTitle>
          <CardDescription>
            {isInstructor
              ? "Instructors can audit connection coverage. Students must connect their own Google accounts."
              : "Connect your Google account for richer invite handling. Meeting invites can still be sent with partial connections."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isInstructor ? (
            <div className="rounded-md border bg-slate-50 px-3 py-3 text-xs text-slate-700">
              Student-owned OAuth only in v1. Share this page with a signed-in student if their account still needs Calendar access.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <Input value={selfStatus?.email ?? viewerEmail} readOnly disabled />
              <Button variant="outline" onClick={startGoogleConnect} disabled={googleLoading}>
                Connect Google
              </Button>
              <Button variant="ghost" onClick={revokeGoogleConnect} disabled={googleLoading}>
                Disconnect
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(googleStatus?.members ?? team.members.map((member) => ({
              id: member.id,
              name: member.name,
              email: member.email,
              connected: false
            }))).map((member) => (
              <Badge key={member.id} variant={member.connected ? "success" : "warning"}>
                {member.name}: {member.connected ? "Connected" : "Not connected"}
              </Badge>
            ))}
          </div>

          {googleStatus?.membersMissingGoogle?.length ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Missing Google connections: {googleStatus.membersMissingGoogle.join(", ")}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rewrite Message</CardTitle>
                <CardDescription>Polish a draft before posting it in the group.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={rewrite.message}
                  onChange={(event) =>
                    setRewrite((current) => ({ ...current, message: event.target.value }))
                  }
                  rows={4}
                />
                <div className="grid gap-3 xl:grid-cols-2">
                  <Select
                    value={rewrite.tone}
                    onValueChange={(value) =>
                      setRewrite((current) => ({ ...current, tone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="polite">Polite</SelectItem>
                      <SelectItem value="encouraging">Encouraging</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={rewrite.audience}
                    onChange={(event) =>
                      setRewrite((current) => ({ ...current, audience: event.target.value }))
                    }
                    placeholder="Who will read this? (e.g., teammates, TA, professor)"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Add the intended audience so the rewrite tone fits the right people.
                </p>
                <Button
                  className="w-full"
                  onClick={() => requestPreview("rewrite_message", rewrite)}
                  disabled={loadingIntent === "rewrite_message" || rewriteFormInvalid}
                >
                  {loadingIntent === "rewrite_message" ? "Preparing..." : "Preview Rewrite"}
                </Button>
                {rewriteFormInvalid ? (
                  <p className="text-xs text-amber-700">
                    {rewriteMessageMissing
                      ? "Add a longer draft message."
                      : "Add who will read this message to continue."}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan Meeting</CardTitle>
                <CardDescription>
                  Propose the best slot from saved availability. By default, copilot searches the
                  next 14 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 xl:grid-cols-2">
                  <Input
                    type="number"
                    min={15}
                    max={240}
                    value={meeting.durationMin}
                    onChange={(event) =>
                      setMeeting((current) => ({ ...current, durationMin: event.target.value }))
                    }
                    placeholder="Duration (min)"
                  />
                  <Input
                    value={meeting.agenda}
                    onChange={(event) =>
                      setMeeting((current) => ({ ...current, agenda: event.target.value }))
                    }
                    placeholder="Agenda"
                  />
                </div>
                <details className="rounded-md border px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700">
                    More options (date window)
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Leave these empty to use the default next-14-day search window.
                  </p>
                  <div className="mt-2 grid gap-3 xl:grid-cols-2">
                    <Input
                      type="date"
                      value={meeting.dateRangeStart}
                      onChange={(event) =>
                        setMeeting((current) => ({
                          ...current,
                          dateRangeStart: event.target.value
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={meeting.dateRangeEnd}
                      onChange={(event) =>
                        setMeeting((current) => ({
                          ...current,
                          dateRangeEnd: event.target.value
                        }))
                      }
                    />
                  </div>
                </details>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={meeting.createCalendarInvite}
                    onChange={(event) =>
                      setMeeting((current) => ({
                        ...current,
                        createCalendarInvite: event.target.checked
                      }))
                    }
                  />
                  Create Google Calendar event + Meet link after approval
                </label>
                <Button
                  className="w-full"
                  onClick={() =>
                    requestPreview("schedule_meeting", {
                      durationMin: Number(meeting.durationMin) || 60,
                      dateRangeStart: meeting.dateRangeStart || null,
                      dateRangeEnd: meeting.dateRangeEnd || null,
                      createCalendarInvite: meeting.createCalendarInvite,
                      agenda: meeting.agenda || null
                    })
                  }
                  disabled={loadingIntent === "schedule_meeting"}
                >
                  {loadingIntent === "schedule_meeting" ? "Planning..." : "Preview Meeting Plan"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meeting Notes to Tasks</CardTitle>
                <CardDescription>
                  Paste meeting notes and copilot will draft a summary, action items, and open
                  questions. Tasks are only created after approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={followup.meetingId || "new"}
                  onValueChange={(value) =>
                    setFollowup((current) => ({
                      ...current,
                      meetingId: value === "new" ? "" : value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a meeting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create new completed meeting</SelectItem>
                    {team.meetings.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.id} · {item.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={followup.notes}
                  onChange={(event) =>
                    setFollowup((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={5}
                />
                <Button
                  className="w-full"
                  onClick={() =>
                    requestPreview("meeting_followup", {
                      meetingId: followup.meetingId || null,
                      notes: followup.notes
                    })
                  }
                  disabled={loadingIntent === "meeting_followup"}
                >
                  {loadingIntent === "meeting_followup"
                    ? "Summarizing..."
                    : "Preview Notes to Tasks"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Status Summary</CardTitle>
                <CardDescription>
                  Snapshot of team progress, upcoming meetings, and participation watch items.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  Uses current tasks, meetings, and participation signals already attached to this
                  team.
                </div>
                <Button
                  className="w-full"
                  onClick={() => requestPreview("weekly_pulse", {})}
                  disabled={loadingIntent === "weekly_pulse"}
                >
                  {loadingIntent === "weekly_pulse" ? "Reviewing..." : "Generate Team Status"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Preview</CardTitle>
                {activeIntent ? <Badge variant="secondary">{intentLabels[activeIntent]}</Badge> : null}
              </div>
              <CardDescription>
                The copilot drafts a plan first, then you approve the final action.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {preview ? (
                <>
                  <div>
                    <p className="font-medium">{preview.preview.headline}</p>
                    <p className="mt-1 text-muted-foreground">{preview.preview.summary}</p>
                  </div>
                  {preview.preview.sections.map((section) => (
                    <div key={section.title} className="rounded-md border px-3 py-3">
                      <p className="font-medium">{section.title}</p>
                      <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{section.body}</p>
                      {section.bullets.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-700">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>• {bullet}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                  {preview.suggestedActions.length > 0 ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                        Suggested next step
                      </p>
                      <p className="mt-1 text-sm text-amber-900">{preview.suggestedActions[0]}</p>
                    </div>
                  ) : null}
                  {preview.meta.fallbackReason ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                      {preview.meta.fallbackReason}
                    </div>
                  ) : null}
                  {preview.diagnostics?.windowUsed ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700">
                      Search window: {preview.diagnostics.windowUsed.startDate} to{" "}
                      {preview.diagnostics.windowUsed.endDate}. Source:{" "}
                      {preview.diagnostics.availabilitySource === "google_freebusy_mixed"
                        ? "mixed (intake + Google-connected members)"
                        : "intake availability"}.
                    </div>
                  ) : null}
                  {preview.diagnostics?.membersMissingGoogle?.length ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                      Some members are not connected to Google yet:{" "}
                      {preview.diagnostics.membersMissingGoogle.join(", ")}. Invite creation still
                      works with warnings.
                    </div>
                  ) : null}
                  {executed?.externalLinks?.meetUrl || executed?.externalLinks?.calendarHtmlLink ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-900">
                      {executed.externalLinks.calendarHtmlLink ? (
                        <p>Calendar link: {executed.externalLinks.calendarHtmlLink}</p>
                      ) : null}
                      {executed.externalLinks.meetUrl ? (
                        <p className="mt-1">Meet link: {executed.externalLinks.meetUrl}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {executed?.membersMissingGoogle?.length ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                      Invite sent with missing Google connections for:{" "}
                      {executed.membersMissingGoogle.join(", ")}.
                    </div>
                  ) : null}
                  {preview.requiresApproval ? (
                    <Button className="w-full" onClick={executePreview} disabled={executing}>
                      {executing ? "Saving..." : "Approve and Save"}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No approval needed for this action.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Pick one of the four copilot actions to generate a preview.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Copilot Actions</CardTitle>
              <CardDescription>Newest previews and executed actions for this team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {team.copilotRuns.length > 0 ? (
                team.copilotRuns.slice(0, 5).map((run) => (
                  <div key={run.id} className="rounded-md border px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{intentLabels[run.intent]}</p>
                      <Badge
                        variant={
                          run.status === "executed"
                            ? "success"
                            : run.status === "failed"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {run.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{run.outputSummary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatTimestamp(run.executedAt ?? run.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No copilot runs yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
