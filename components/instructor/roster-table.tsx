"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AvailabilityPicker } from "@/components/student/availability-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  parseCommaSeparatedList,
  stringifyAvailability,
  stringifyCommaSeparatedList
} from "@/lib/student-intake";
import type { StudentIntake } from "@/types/domain";

const communicationStyles = [
  { value: "direct", label: "Direct" },
  { value: "collaborative", label: "Collaborative" },
  { value: "reflective", label: "Reflective" },
  { value: "facilitative", label: "Facilitative" },
  { value: "analytical", label: "Analytical" }
] as const;

type RosterTableProps = {
  students: StudentIntake[];
};

type EditableStudentDraft = {
  name: string;
  email: string;
  timezone: string;
  preferredRole: string;
  communicationStyle: StudentIntake["communicationStyle"];
  availability: StudentIntake["availability"];
  strengthsRaw: string;
  growthAreasRaw: string;
  collaborationPreferencesRaw: string;
  shortReflection: string;
};

function buildDraft(student: StudentIntake): EditableStudentDraft {
  return {
    name: student.name,
    email: student.email,
    timezone: student.timezone,
    preferredRole: student.preferredRole,
    communicationStyle: student.communicationStyle,
    availability: student.availability,
    strengthsRaw: stringifyCommaSeparatedList(student.strengths),
    growthAreasRaw: stringifyCommaSeparatedList(student.growthAreas),
    collaborationPreferencesRaw: stringifyCommaSeparatedList(student.collaborationPreferences),
    shortReflection: student.shortReflection
  };
}

function buildPayload(student: StudentIntake, draft: EditableStudentDraft): StudentIntake {
  return {
    id: student.id,
    name: draft.name.trim(),
    email: draft.email.trim(),
    timezone: draft.timezone.trim(),
    preferredRole: draft.preferredRole.trim(),
    communicationStyle: draft.communicationStyle,
    availability: draft.availability,
    strengths: parseCommaSeparatedList(draft.strengthsRaw),
    growthAreas: parseCommaSeparatedList(draft.growthAreasRaw),
    collaborationPreferences: parseCommaSeparatedList(draft.collaborationPreferencesRaw),
    shortReflection: draft.shortReflection.trim()
  };
}

async function getErrorMessage(response: Response) {
  const fallback = "Failed to update student.";

  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

function EditableRosterRow({ student }: { student: StudentIntake }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<EditableStudentDraft>(() => buildDraft(student));
  const router = useRouter();
  const { push } = useToast();

  useEffect(() => {
    setDraft(buildDraft(student));
    setEditing(false);
  }, [student]);

  function startEditing() {
    setDraft(buildDraft(student));
    setEditing(true);
    setExpanded(true);
  }

  function cancelEditing() {
    setDraft(buildDraft(student));
    setEditing(false);
  }

  async function saveStudent() {
    setSaving(true);

    try {
      const response = await fetch(`/api/instructor/students/${student.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload(student, draft))
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      push({
        kind: "success",
        title: "Student updated",
        description: `${draft.name || student.name} was saved to the roster.`
      });
      setEditing(false);
      router.refresh();
    } catch (error) {
      push({
        kind: "error",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Fragment>
      <TableRow className="align-top">
        <TableCell className="font-medium">
          {editing ? (
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          ) : (
            student.name
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <Input
              type="email"
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            />
          ) : (
            student.email
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <Input
              value={draft.timezone}
              onChange={(event) => setDraft((current) => ({ ...current, timezone: event.target.value }))}
            />
          ) : (
            student.timezone
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <Input
              value={draft.preferredRole}
              onChange={(event) =>
                setDraft((current) => ({ ...current, preferredRole: event.target.value }))
              }
            />
          ) : (
            student.preferredRole
          )}
        </TableCell>
        <TableCell>
          {editing ? (
            <Select
              value={draft.communicationStyle}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  communicationStyle: value as StudentIntake["communicationStyle"]
                }))
              }
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {communicationStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary">{student.communicationStyle}</Badge>
          )}
        </TableCell>
        <TableCell className="w-[260px]">
          <div className="flex flex-wrap justify-end gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={saveStudent} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={startEditing}>
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Hide details" : "More details"}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow className="bg-slate-50/80">
          <TableCell colSpan={6} className="py-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Availability
                </p>
                {editing ? (
                  <AvailabilityPicker
                    value={draft.availability}
                    onChange={(availability) =>
                      setDraft((current) => ({ ...current, availability }))
                    }
                  />
                ) : (
                  <p className="text-sm text-slate-700">{stringifyAvailability(student.availability)}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Strengths
                </p>
                {editing ? (
                  <Input
                    value={draft.strengthsRaw}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, strengthsRaw: event.target.value }))
                    }
                    placeholder="frontend, user research, facilitation"
                  />
                ) : (
                  <p className="text-sm text-slate-700">
                    {stringifyCommaSeparatedList(student.strengths)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Growth areas
                </p>
                {editing ? (
                  <Input
                    value={draft.growthAreasRaw}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, growthAreasRaw: event.target.value }))
                    }
                    placeholder="leadership, backend, public speaking"
                  />
                ) : (
                  <p className="text-sm text-slate-700">
                    {stringifyCommaSeparatedList(student.growthAreas)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Collaboration preferences
                </p>
                {editing ? (
                  <Input
                    value={draft.collaborationPreferencesRaw}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        collaborationPreferencesRaw: event.target.value
                      }))
                    }
                    placeholder="shared docs, async updates, weekly standups"
                  />
                ) : (
                  <p className="text-sm text-slate-700">
                    {stringifyCommaSeparatedList(student.collaborationPreferences)}
                  </p>
                )}
              </div>

              <div className="space-y-2 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Short reflection
                </p>
                {editing ? (
                  <Textarea
                    value={draft.shortReflection}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, shortReflection: event.target.value }))
                    }
                    rows={4}
                  />
                ) : (
                  <p className="text-sm leading-6 text-slate-700">{student.shortReflection}</p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

export function RosterTable({ students }: RosterTableProps) {
  if (!students.length) {
    return <p className="text-sm text-muted-foreground">No students loaded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Timezone</TableHead>
          <TableHead>Preferred Role</TableHead>
          <TableHead>Style</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <EditableRosterRow key={student.id} student={student} />
        ))}
      </TableBody>
    </Table>
  );
}
