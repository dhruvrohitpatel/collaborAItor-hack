export async function createGoogleCalendarEvent(params: {
  accessToken: string;
  summary: string;
  startAt: string;
  endAt: string;
  timezone: string;
  attendeeEmails: string[];
}) {
  const requestId = `collaboraitor-${Math.random().toString(36).slice(2, 10)}`;
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: params.summary,
        start: {
          dateTime: params.startAt,
          timeZone: params.timezone
        },
        end: {
          dateTime: params.endAt,
          timeZone: params.timezone
        },
        attendees: params.attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: {
              type: "hangoutsMeet"
            }
          }
        }
      })
    }
  );

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    htmlLink?: string;
    conferenceData?: {
      entryPoints?: Array<{ uri?: string; entryPointType?: string }>;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message ?? "Google Calendar event creation failed.");
  }

  const meetUrl =
    payload.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")
      ?.uri ?? null;

  return {
    eventId: payload.id,
    htmlLink: payload.htmlLink ?? null,
    meetUrl
  };
}
