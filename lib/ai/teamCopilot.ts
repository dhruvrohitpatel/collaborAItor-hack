import { getSeedMessages } from "@/data/seedMessages";
import { computeParticipation, detectDisengagement } from "@/lib/ai/participation";
import { rewriteMessage, summarizeMeetingNotes } from "@/lib/ai/mock";
import { createGoogleCalendarEvent } from "@/lib/google/calendar";
import {
  getGoogleConnectionStatusByEmails,
  getUsableAccessTokenForEmail
} from "@/lib/google/connections";
import { hasGoogleOAuthConfig } from "@/lib/google/config";
import type {
  TeamCopilotExecuteRequest,
  TeamCopilotExecuteResponse,
  TeamCopilotRequest,
  TeamCopilotResponse
} from "@/lib/ai/schemas";
import { normalizeTeamWorkspace } from "@/lib/team-workspace";
import type {
  Team,
  TeamCopilotPreview,
  TeamCopilotRun,
  TeamCopilotIntent,
  TeamMeeting,
  TeamMeetingSlot,
  TeamTask
} from "@/types/domain";

const COPILOT_META = {
  provider: "mock" as const,
  model: "team-copilot-v1",
  fallbackReason: null
};

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function nowIso() {
  return new Date().toISOString();
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function generateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
}

function weekdayIndex(day: string) {
  return DAY_ORDER.indexOf(day as (typeof DAY_ORDER)[number]);
}

function nextOccurrenceForDay(day: string, startDate: Date) {
  const base = new Date(startDate);
  base.setHours(0, 0, 0, 0);

  const currentDay = base.getDay();
  const targetDay = weekdayIndex(day);
  const delta = (targetDay - currentDay + 7) % 7;

  base.setDate(base.getDate() + delta);
  return base;
}

function combineDateAndTime(date: Date, time: string) {
  const next = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

function mostCommonTimezone(team: Team) {
  const counts = new Map<string, number>();

  team.members.forEach((member) => {
    counts.set(member.timezone, (counts.get(member.timezone) || 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "UTC";
}

function formatDateTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(value));
}

function trimRuns(runs: TeamCopilotRun[]) {
  return runs.slice(0, 10);
}

function pushRun(team: Team, run: TeamCopilotRun) {
  team.copilotRuns = trimRuns([run, ...team.copilotRuns]);
}

function updateRun(
  team: Team,
  runId: string,
  updater: (run: TeamCopilotRun) => TeamCopilotRun
): TeamCopilotRun | null {
  let updatedRun: TeamCopilotRun | null = null;

  team.copilotRuns = team.copilotRuns.map((run) => {
    if (run.id !== runId) {
      return run;
    }

    updatedRun = updater(run);
    return updatedRun;
  });

  return updatedRun;
}

function createPreview(
  headline: string,
  summary: string,
  sections: TeamCopilotPreview["sections"]
): TeamCopilotPreview {
  return { headline, summary, sections };
}

function createRun(params: {
  intent: TeamCopilotIntent;
  actorStudentId: string | null;
  inputSnapshot: Record<string, unknown>;
  preview: TeamCopilotPreview;
  outputSummary: string;
  suggestedActions: string[];
  requiresApproval: boolean;
  persistedRefs?: TeamCopilotRun["persistedRefs"];
}): TeamCopilotRun {
  return {
    id: generateId("run"),
    intent: params.intent,
    status: "preview",
    actorStudentId: params.actorStudentId,
    inputSnapshot: params.inputSnapshot,
    preview: params.preview,
    outputSummary: params.outputSummary,
    suggestedActions: params.suggestedActions,
    requiresApproval: params.requiresApproval,
    persistedRefs: params.persistedRefs ?? null,
    approvedAt: null,
    executedAt: null,
    errorMessage: null,
    createdAt: nowIso()
  };
}

function buildMeetingSlots(
  team: Team,
  durationMin: number,
  dateRangeStart: string | null,
  dateRangeEnd: string | null
): TeamMeetingSlot[] {
  const startDate = dateRangeStart ? new Date(`${dateRangeStart}T09:00:00`) : new Date();
  const endDate = dateRangeEnd
    ? new Date(`${dateRangeEnd}T23:59:59`)
    : new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 14);
  const candidates: TeamMeetingSlot[] = [];

  DAY_ORDER.forEach((day) => {
    const occurrences: Date[] = [];
    let pointer = nextOccurrenceForDay(day, startDate);

    while (pointer <= endDate) {
      occurrences.push(new Date(pointer));
      pointer = new Date(pointer);
      pointer.setDate(pointer.getDate() + 7);
    }

    occurrences.forEach((occurrence) => {
      for (let startMinute = 8 * 60; startMinute <= 21 * 60; startMinute += 30) {
        const endMinute = startMinute + durationMin;
        if (endMinute > 24 * 60) continue;

        const availableMembers = team.members.filter((member) =>
          member.availability.some(
            (slot) =>
              slot.day === day &&
              parseTimeToMinutes(slot.start) <= startMinute &&
              parseTimeToMinutes(slot.end) >= endMinute
          )
        );

        if (availableMembers.length < 2) {
          continue;
        }

        const startAt = combineDateAndTime(occurrence, minutesToTime(startMinute));
        const endAt = combineDateAndTime(occurrence, minutesToTime(endMinute));
        const score = Math.round((availableMembers.length / team.members.length) * 100);

        candidates.push({
          startAt,
          endAt,
          score,
          memberIdsAvailable: availableMembers.map((member) => member.id)
        });
      }
    });
  });

  return candidates
    .sort((left, right) => {
      if (right.memberIdsAvailable.length !== left.memberIdsAvailable.length) {
        return right.memberIdsAvailable.length - left.memberIdsAvailable.length;
      }
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.startAt.localeCompare(right.startAt);
    })
    .filter(
      (candidate, index, list) =>
        index ===
        list.findIndex(
          (item) => item.startAt === candidate.startAt && item.endAt === candidate.endAt
        )
    )
    .slice(0, 3);
}

function buildRewritePreview(
  rewrittenMessage: string,
  note: string,
  audience: string
): TeamCopilotPreview {
  return createPreview("Rewrite ready to send", "Prepared a calmer, clearer version of the draft.", [
    {
      title: "Suggested rewrite",
      body: rewrittenMessage,
      bullets: []
    },
    {
      title: "Copilot note",
      body: note,
      bullets: [`Audience kept as ${audience}.`]
    }
  ]);
}

function buildMeetingPreview(
  team: Team,
  proposedSlots: TeamMeetingSlot[],
  durationMin: number,
  timezone: string,
  createCalendarInvite: boolean
): TeamCopilotPreview {
  if (!proposedSlots.length) {
    return createPreview(
      "Limited overlap detected",
      "The copilot could not find a strong shared slot, but it can still save a fallback proposal.",
      [
        {
          title: "Next step",
          body: "Ask teammates to add more availability or shorten the meeting length.",
          bullets: [`Current requested duration: ${durationMin} minutes.`]
        }
      ]
    );
  }

  return createPreview(
    "Meeting plan ready for approval",
    `Found ${proposedSlots.length} workable meeting option${proposedSlots.length === 1 ? "" : "s"} for ${team.id}.`,
    [
      {
        title: "Best slots",
        body: `Times shown in ${timezone}.`,
        bullets: proposedSlots.map(
          (slot) =>
            `${formatDateTime(slot.startAt, timezone)} to ${formatDateTime(
              slot.endAt,
              timezone
            )} · ${slot.memberIdsAvailable.length}/${team.members.length} available`
        )
      },
      {
        title: "What approval does",
        body: createCalendarInvite
          ? "Approval will schedule the top slot and attach stub calendar + Meet links for the demo."
          : "Approval will save the top slot as the scheduled meeting.",
        bullets: []
      }
    ]
  );
}

function buildFollowupPreview(result: Awaited<ReturnType<typeof summarizeMeetingNotes>>) {
  return createPreview(
    "Meeting notes processed",
    `Extracted ${result.actionItems.length} action item${result.actionItems.length === 1 ? "" : "s"} from the notes.`,
    [
      {
        title: "Summary",
        body: result.summary,
        bullets: []
      },
      {
        title: "Action items",
        body: "Tasks will be created only after approval.",
        bullets: result.actionItems.map(({ task, owner }) =>
          owner ? `${task} -> ${owner}` : task
        )
      },
      {
        title: "Open questions",
        body:
          result.openQuestions.length > 0
            ? "Unresolved items to carry into the next sync."
            : "No unresolved questions were detected.",
        bullets: result.openQuestions
      }
    ]
  );
}

function buildWeeklyPulsePreview(team: Team) {
  const openTasks = team.tasks.filter((task) => task.status !== "done");
  const blockedTasks = openTasks.filter((task) => task.status === "blocked");
  const nextMeeting = [...team.meetings]
    .filter((meeting) => meeting.status === "proposed" || meeting.status === "scheduled")
    .sort((left, right) => {
      const leftValue = left.selectedSlot?.startAt ?? left.proposedSlots[0]?.startAt ?? "";
      const rightValue = right.selectedSlot?.startAt ?? right.proposedSlots[0]?.startAt ?? "";
      return leftValue.localeCompare(rightValue);
    })[0];

  const signals = computeParticipation(getSeedMessages(team.id, team.members), team.members, 7);
  const watchList = detectDisengagement(signals, {
    minSharePercent: 15,
    silenceDays: 3
  });
  const timezone = mostCommonTimezone(team);

  return createPreview("Team status summary ready", `Reviewed ${openTasks.length} open task(s), ${team.meetings.length} meeting record(s), and recent participation signals.`, [
    {
      title: "Current workload",
      body:
        blockedTasks.length > 0
          ? `${blockedTasks.length} blocked task(s) need attention.`
          : "No blocked tasks detected right now.",
      bullets: openTasks.slice(0, 4).map((task) => `${task.title} · ${task.status.replace("_", " ")}`)
    },
    {
      title: "Upcoming sync",
      body: nextMeeting
        ? `Next meeting is ${formatDateTime(
            nextMeeting.selectedSlot?.startAt ?? nextMeeting.proposedSlots[0]?.startAt ?? nowIso(),
            timezone
          )}.`
        : "No upcoming meeting is currently on the board.",
      bullets: nextMeeting?.agenda ? [nextMeeting.agenda] : []
    },
    {
      title: "Watch items",
      body:
        watchList.length > 0
          ? "Participation data suggests the team should check in on contribution balance."
          : "Recent participation looks balanced enough for now.",
      bullets: watchList.map(
        (candidate) =>
          `${candidate.signal.memberName}: ${candidate.reasons.join("; ")}`
      )
    }
  ]);
}

function matchMemberIdByOwner(team: Team, owner: string) {
  const normalized = owner.trim().toLowerCase();
  return (
    team.members.find((member) => member.name.toLowerCase() === normalized)?.id ??
    team.members.find((member) => member.name.toLowerCase().includes(normalized))?.id ??
    null
  );
}

function createTask(params: {
  title: string;
  description: string;
  assigneeStudentId: string | null;
  sourceRunId: string;
  sourceMeetingId: string | null;
  createdByStudentId: string | null;
}): TeamTask {
  const timestamp = nowIso();

  return {
    id: generateId("task"),
    title: params.title,
    description: params.description,
    status: "todo",
    priority: "medium",
    assigneeStudentId: params.assigneeStudentId,
    source: "meeting_followup",
    sourceRunId: params.sourceRunId,
    sourceMeetingId: params.sourceMeetingId,
    dueAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByStudentId: params.createdByStudentId
  };
}

function createMeeting(params: {
  proposedSlots: TeamMeetingSlot[];
  durationMin: number;
  timezone: string;
  agenda: string | null;
  createdByStudentId: string | null;
}): TeamMeeting {
  const timestamp = nowIso();

  return {
    id: generateId("meeting"),
    status: "proposed",
    proposedSlots: params.proposedSlots,
    selectedSlot: null,
    durationMin: params.durationMin,
    timezone: params.timezone,
    calendarEventId: null,
    calendarHtmlLink: null,
    meetUrl: null,
    agenda: params.agenda,
    notesRaw: null,
    summary: null,
    openQuestions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByStudentId: params.createdByStudentId
  };
}

function createMockMeetUrl(meetingId: string) {
  const token = meetingId.replace(/[^a-z0-9]/gi, "").slice(-9).padEnd(9, "x");
  return `https://meet.google.com/${token.slice(0, 3)}-${token.slice(3, 6)}-${token.slice(6, 9)}`;
}

export async function createCopilotRun(
  teamInput: Team,
  request: TeamCopilotRequest
): Promise<{ team: Team; response: TeamCopilotResponse }> {
  const team = normalizeTeamWorkspace(teamInput);

  if (!team.aiOptIn) {
    throw new Error("AI support is disabled for this team.");
  }

  if (request.intent === "rewrite_message") {
    const result = await rewriteMessage(
      request.payload.message,
      request.payload.tone,
      request.payload.audience
    );
    const run = createRun({
      intent: request.intent,
      actorStudentId: request.actorStudentId,
      inputSnapshot: {
        ...request.payload,
        rewrittenMessage: result.rewrittenMessage,
        rewriteNote: result.notes
      },
      preview: buildRewritePreview(
        result.rewrittenMessage,
        result.notes,
        request.payload.audience
      ),
      outputSummary: "Prepared a refined version of the team message.",
      suggestedActions: ["Review the draft and finalize it."],
      requiresApproval: false
    });

    pushRun(team, run);

    return {
      team,
      response: {
        runId: run.id,
        intent: run.intent,
        requiresApproval: run.requiresApproval,
        preview: run.preview,
        suggestedActions: run.suggestedActions,
        persistedRefs: run.persistedRefs,
        diagnostics: null,
        meta: COPILOT_META
      }
    };
  }

  if (request.intent === "schedule_meeting") {
    const today = new Date();
    const payloadStart = request.payload.dateRangeStart
      ? new Date(`${request.payload.dateRangeStart}T00:00:00`)
      : today;
    const derivedEndFromStart = new Date(payloadStart);
    derivedEndFromStart.setDate(derivedEndFromStart.getDate() + 14);
    const fallbackEndFromToday = new Date(today);
    fallbackEndFromToday.setDate(fallbackEndFromToday.getDate() + 14);
    const windowUsed = {
      startDate: request.payload.dateRangeStart ?? toDateOnly(today),
      endDate:
        request.payload.dateRangeEnd ??
        toDateOnly(request.payload.dateRangeStart ? derivedEndFromStart : fallbackEndFromToday)
    };
    const googleStatus = await getGoogleConnectionStatusByEmails(
      team.members.map((member) => member.email)
    );
    const availabilitySource =
      googleStatus.connectedEmails.length > 0 ? "google_freebusy_mixed" : "intake";
    const timezone = mostCommonTimezone(team);
    const proposedSlots = buildMeetingSlots(
      team,
      request.payload.durationMin,
      windowUsed.startDate,
      windowUsed.endDate
    );
    const meeting = createMeeting({
      proposedSlots,
      durationMin: request.payload.durationMin,
      timezone,
      agenda: request.payload.agenda,
      createdByStudentId: request.actorStudentId
    });
    team.meetings = [meeting, ...team.meetings];

    const run = createRun({
      intent: request.intent,
      actorStudentId: request.actorStudentId,
      inputSnapshot: {
        ...request.payload,
        availabilitySource,
        membersMissingGoogle: googleStatus.membersMissingGoogle,
        windowUsed,
        meetingId: meeting.id,
        topSlotStartAt: proposedSlots[0]?.startAt ?? null,
        topSlotEndAt: proposedSlots[0]?.endAt ?? null
      },
      preview: buildMeetingPreview(
        team,
        proposedSlots,
        request.payload.durationMin,
        timezone,
        request.payload.createCalendarInvite
      ),
      outputSummary: proposedSlots.length
        ? "Prepared meeting options and stored the proposal."
        : "Stored a fallback meeting proposal with limited overlap.",
      suggestedActions: proposedSlots.length
        ? ["Approve to schedule the top slot."]
        : ["Adjust duration or expand availability before approving."],
      requiresApproval: true,
      persistedRefs: {
        meetingId: meeting.id
      }
    });

    pushRun(team, run);

    return {
      team,
      response: {
        runId: run.id,
        intent: run.intent,
        requiresApproval: run.requiresApproval,
        preview: run.preview,
        suggestedActions: run.suggestedActions,
        persistedRefs: run.persistedRefs,
        diagnostics: {
          availabilitySource,
          windowUsed,
          membersMissingGoogle: googleStatus.membersMissingGoogle
        },
        meta: COPILOT_META
      }
    };
  }

  if (request.intent === "meeting_followup") {
    const result = await summarizeMeetingNotes(request.payload.notes);
    const run = createRun({
      intent: request.intent,
      actorStudentId: request.actorStudentId,
      inputSnapshot: {
        ...request.payload,
        summary: result.summary,
        actionItems: result.actionItems,
        openQuestions: result.openQuestions
      },
      preview: buildFollowupPreview(result),
      outputSummary: "Prepared a structured meeting notes-to-tasks draft.",
      suggestedActions: ["Approve to update the meeting record and create tasks."],
      requiresApproval: true,
      persistedRefs: request.payload.meetingId
        ? {
            meetingId: request.payload.meetingId
          }
        : null
    });

    pushRun(team, run);

    return {
      team,
      response: {
        runId: run.id,
        intent: run.intent,
        requiresApproval: run.requiresApproval,
        preview: run.preview,
        suggestedActions: run.suggestedActions,
        persistedRefs: run.persistedRefs,
        diagnostics: null,
        meta: COPILOT_META
      }
    };
  }

  const preview = buildWeeklyPulsePreview(team);
  const run = createRun({
    intent: request.intent,
    actorStudentId: request.actorStudentId,
    inputSnapshot: {
      taskCount: team.tasks.length,
      meetingCount: team.meetings.length,
      lastPulseAt: team.lastPulseAt
    },
    preview,
    outputSummary: "Prepared a team status summary using current team memory.",
    suggestedActions: ["Save the pulse snapshot for the team."],
    requiresApproval: false
  });

  pushRun(team, run);

  return {
    team,
    response: {
      runId: run.id,
      intent: run.intent,
      requiresApproval: run.requiresApproval,
      preview: run.preview,
      suggestedActions: run.suggestedActions,
      persistedRefs: run.persistedRefs,
      diagnostics: null,
      meta: COPILOT_META
    }
  };
}

export async function executeCopilotRun(
  teamInput: Team,
  request: TeamCopilotExecuteRequest
): Promise<{ team: Team; response: TeamCopilotExecuteResponse }> {
  const team = normalizeTeamWorkspace(teamInput);
  const run = team.copilotRuns.find((candidate) => candidate.id === request.runId);

  if (!run) {
    throw new Error("Copilot run was not found.");
  }

  const approvalTimestamp = nowIso();

  if (run.intent === "rewrite_message") {
    updateRun(team, run.id, (current) => ({
      ...current,
      status: "executed",
      approvedAt: approvalTimestamp,
      executedAt: approvalTimestamp
    }));

    return {
      team,
      response: {
        status: "executed",
        updatedRefs: run.persistedRefs,
        externalLinks: null,
        membersMissingGoogle: [],
        meta: COPILOT_META
      }
    };
  }

  if (run.intent === "schedule_meeting") {
    const googleStatus = await getGoogleConnectionStatusByEmails(
      team.members.map((member) => member.email)
    );
    const connectedEmailSet = new Set(googleStatus.connectedEmails.map((email) => email.toLowerCase()));
    const meetingId =
      typeof run.inputSnapshot.meetingId === "string" ? run.inputSnapshot.meetingId : null;
    const meeting = team.meetings.find((candidate) => candidate.id === meetingId);

    if (!meeting) {
      updateRun(team, run.id, (current) => ({
        ...current,
        status: "failed",
        approvedAt: approvalTimestamp,
        executedAt: approvalTimestamp,
        errorMessage: "Meeting proposal could not be found."
      }));

      return {
        team,
        response: {
          status: "failed",
          updatedRefs: run.persistedRefs,
          externalLinks: null,
          membersMissingGoogle: googleStatus.membersMissingGoogle,
          meta: COPILOT_META
        }
      };
    }

    const topSlot = meeting.proposedSlots[0] ?? null;
    const shouldCreateInvite = Boolean(run.inputSnapshot.createCalendarInvite);
    const actorMember = team.members.find((member) => member.id === run.actorStudentId) ?? null;
    const actorIsConnected = Boolean(
      actorMember?.email && connectedEmailSet.has(actorMember.email.toLowerCase())
    );
    const fallbackConnectedMember =
      team.members.find((member) => connectedEmailSet.has(member.email.toLowerCase())) ?? null;
    const organizer = actorIsConnected
      ? actorMember
      : fallbackConnectedMember ?? actorMember ?? team.members[0] ?? null;

    if (shouldCreateInvite && !topSlot) {
      updateRun(team, run.id, (current) => ({
        ...current,
        status: "failed",
        approvedAt: approvalTimestamp,
        executedAt: approvalTimestamp,
        errorMessage: "No meeting slot is available for calendar invite creation."
      }));

      return {
        team,
        response: {
          status: "failed",
          updatedRefs: run.persistedRefs,
          externalLinks: null,
          membersMissingGoogle: googleStatus.membersMissingGoogle,
          meta: COPILOT_META
        }
      };
    }

    let calendarEventId: string | null = null;
    let calendarHtmlLink: string | null = null;
    let meetUrl: string | null = null;

    if (shouldCreateInvite && topSlot) {
      if (hasGoogleOAuthConfig() && !organizer) {
        updateRun(team, run.id, (current) => ({
          ...current,
          status: "failed",
          approvedAt: approvalTimestamp,
          executedAt: approvalTimestamp,
          errorMessage: "No connected Google organizer found to create this event."
        }));

        return {
          team,
          response: {
            status: "failed",
            updatedRefs: run.persistedRefs,
            externalLinks: null,
            membersMissingGoogle: googleStatus.membersMissingGoogle,
            meta: COPILOT_META
          }
        };
      }

      if (!organizer?.email) {
        throw new Error("Meeting organizer email could not be determined.");
      }

      if (!hasGoogleOAuthConfig()) {
        calendarEventId = `mock-cal-${meeting.id}`;
        calendarHtmlLink = `https://calendar.google.com/calendar/u/0/r/eventedit/${meeting.id}`;
        meetUrl = createMockMeetUrl(meeting.id);
      } else {
        const organizerToken = await getUsableAccessTokenForEmail(organizer.email);
        const created = await createGoogleCalendarEvent({
          accessToken: organizerToken.accessToken,
          summary: meeting.agenda ?? `${team.id} team sync`,
          startAt: topSlot.startAt,
          endAt: topSlot.endAt,
          timezone: meeting.timezone,
          attendeeEmails: team.members.map((member) => member.email)
        });
        calendarEventId = created.eventId;
        calendarHtmlLink = created.htmlLink;
        meetUrl = created.meetUrl;
      }
    }

    const updatedMeeting: TeamMeeting = {
      ...meeting,
      status: "scheduled",
      selectedSlot: topSlot
        ? {
            startAt: topSlot.startAt,
            endAt: topSlot.endAt
          }
        : null,
      calendarEventId,
      calendarHtmlLink,
      meetUrl,
      updatedAt: approvalTimestamp
    };

    team.meetings = team.meetings.map((candidate) =>
      candidate.id === updatedMeeting.id ? updatedMeeting : candidate
    );
    team.activeMeetingId = updatedMeeting.id;

    updateRun(team, run.id, (current) => ({
      ...current,
      status: "executed",
      approvedAt: approvalTimestamp,
      executedAt: approvalTimestamp,
      persistedRefs: {
        meetingId: updatedMeeting.id
      }
    }));

    return {
      team,
      response: {
        status: "executed",
        updatedRefs: {
          meetingId: updatedMeeting.id
        },
        externalLinks: {
          calendarHtmlLink: updatedMeeting.calendarHtmlLink,
          meetUrl: updatedMeeting.meetUrl
        },
        membersMissingGoogle: googleStatus.membersMissingGoogle,
        meta: COPILOT_META
      }
    };
  }

  if (run.intent === "meeting_followup") {
    const storedSummary =
      typeof run.inputSnapshot.summary === "string" ? run.inputSnapshot.summary : "Meeting reviewed.";
    const storedQuestions = Array.isArray(run.inputSnapshot.openQuestions)
      ? run.inputSnapshot.openQuestions.filter((value): value is string => typeof value === "string")
      : [];
    const actionItems = Array.isArray(run.inputSnapshot.actionItems)
      ? run.inputSnapshot.actionItems
      : [];
    let meetingId =
      typeof run.inputSnapshot.meetingId === "string" ? run.inputSnapshot.meetingId : null;

    const existingMeeting = meetingId
      ? team.meetings.find((candidate) => candidate.id === meetingId)
      : null;

    const meeting =
      existingMeeting ??
      createMeeting({
        proposedSlots: [],
        durationMin: team.preferredMeetingDurationMin,
        timezone: mostCommonTimezone(team),
        agenda: "Follow-up captured from meeting notes",
        createdByStudentId: run.actorStudentId
      });

    meetingId = meeting.id;

    const nextMeeting: TeamMeeting = {
      ...meeting,
      status: "completed",
      notesRaw: typeof run.inputSnapshot.notes === "string" ? run.inputSnapshot.notes : null,
      summary: storedSummary,
      openQuestions: storedQuestions,
      updatedAt: approvalTimestamp
    };

    team.meetings = existingMeeting
      ? team.meetings.map((candidate) => (candidate.id === nextMeeting.id ? nextMeeting : candidate))
      : [nextMeeting, ...team.meetings];

    team.tasks = team.tasks.filter(
      (task) => !(task.source === "meeting_followup" && task.sourceMeetingId === meetingId)
    );

    const nextTasks = actionItems
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const task = "task" in entry && typeof entry.task === "string" ? entry.task : null;
        const owner = "owner" in entry && typeof entry.owner === "string" ? entry.owner : "";
        if (!task) return null;
        return createTask({
          title: task,
          description: `Generated from ${nextMeeting.id} follow-up.`,
          assigneeStudentId: owner ? matchMemberIdByOwner(team, owner) : null,
          sourceRunId: run.id,
          sourceMeetingId: nextMeeting.id,
          createdByStudentId: run.actorStudentId
        });
      })
      .filter((task): task is TeamTask => Boolean(task));

    team.tasks = [...nextTasks, ...team.tasks];

    updateRun(team, run.id, (current) => ({
      ...current,
      status: "executed",
      approvedAt: approvalTimestamp,
      executedAt: approvalTimestamp,
      persistedRefs: {
        meetingId: nextMeeting.id,
        taskIds: nextTasks.map((task) => task.id)
      }
    }));

    return {
      team,
      response: {
        status: "executed",
        updatedRefs: {
          meetingId: nextMeeting.id,
          taskIds: nextTasks.map((task) => task.id)
        },
        externalLinks: null,
        membersMissingGoogle: [],
        meta: COPILOT_META
      }
    };
  }

  team.lastPulseAt = approvalTimestamp;
  updateRun(team, run.id, (current) => ({
    ...current,
    status: "executed",
    approvedAt: approvalTimestamp,
    executedAt: approvalTimestamp
  }));

  return {
    team,
    response: {
      status: "executed",
      updatedRefs: null,
      externalLinks: null,
      membersMissingGoogle: [],
      meta: COPILOT_META
    }
  };
}
