"use client";

import { useState } from "react";

import { AvailabilityPicker } from "@/components/student/availability-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { StudentIntake } from "@/types/domain";

const communicationStyles = [
  { value: "direct", label: "Direct" },
  { value: "collaborative", label: "Collaborative" },
  { value: "reflective", label: "Reflective" },
  { value: "facilitative", label: "Facilitative" },
  { value: "analytical", label: "Analytical" }
] as const;

type QuestionnaireFormState = {
  name: string;
  email: string;
  timezone: string;
  availabilityRaw: string;
  strengthsRaw: string;
  growthAreasRaw: string;
  preferredRole: string;
  communicationStyle: StudentIntake["communicationStyle"];
  collaborationPreferencesRaw: string;
  shortReflection: string;
  classPriority: "low" | "medium" | "high";
  weeklyCapacityHours: string;
  externalCommitments: string;
  scheduleConfidence: "tight" | "manageable" | "flexible";
  academicConfidence: "needs_support" | "steady" | "strong";
  priorExperienceRaw: string;
  communicationHabitsRaw: string;
  leadershipPreference: "avoid" | "supporting" | "comfortable" | "prefer";
  collaborationStylePreferencesRaw: string;
  classGoalsRaw: string;
  openReflection: string;
};

function buildInitialState(initialEmail: string, initialName: string): QuestionnaireFormState {
  return {
    name: initialName,
    email: initialEmail,
    timezone: "America/Phoenix",
    availabilityRaw: "Mon 16:00-18:00, Wed 17:00-19:00",
    strengthsRaw: "",
    growthAreasRaw: "",
    preferredRole: "",
    communicationStyle: "collaborative",
    collaborationPreferencesRaw: "",
    shortReflection: "",
    classPriority: "high",
    weeklyCapacityHours: "8",
    externalCommitments: "",
    scheduleConfidence: "manageable",
    academicConfidence: "steady",
    priorExperienceRaw: "",
    communicationHabitsRaw: "",
    leadershipPreference: "supporting",
    collaborationStylePreferencesRaw: "",
    classGoalsRaw: "",
    openReflection: ""
  };
}

function parseCommaList(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseAvailability(input: string): StudentIntake["availability"] {
  return input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [day, time] = entry.split(" ");
      const [start, end] = (time || "").split("-");
      return {
        day: (day || "Mon") as StudentIntake["availability"][number]["day"],
        start: start || "16:00",
        end: end || "18:00"
      };
    });
}

export function StudentQuestionnaireForm({
  initialEmail,
  initialName
}: {
  initialEmail: string;
  initialName: string;
}) {
  const [form, setForm] = useState<QuestionnaireFormState>(() =>
    buildInitialState(initialEmail, initialName)
  );
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/student/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          timezone: form.timezone,
          availability: parseAvailability(form.availabilityRaw),
          strengths: parseCommaList(form.strengthsRaw),
          growthAreas: parseCommaList(form.growthAreasRaw),
          preferredRole: form.preferredRole,
          communicationStyle: form.communicationStyle,
          collaborationPreferences: parseCommaList(form.collaborationPreferencesRaw),
          shortReflection: form.shortReflection,
          questionnaire: {
            classPriority: form.classPriority,
            weeklyCapacityHours: Number(form.weeklyCapacityHours) || 0,
            externalCommitments: form.externalCommitments || undefined,
            scheduleConfidence: form.scheduleConfidence,
            academicConfidence: form.academicConfidence,
            priorExperience: parseCommaList(form.priorExperienceRaw),
            communicationHabits: parseCommaList(form.communicationHabitsRaw),
            leadershipPreference: form.leadershipPreference,
            collaborationStylePreferences: parseCommaList(form.collaborationStylePreferencesRaw),
            classGoals: parseCommaList(form.classGoalsRaw),
            openReflection: form.openReflection,
            completedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit questionnaire");
      }

      push({
        kind: "success",
        title: "Questionnaire submitted",
        description: "Your onboarding responses are now available for AI profile generation."
      });
      setForm((current) => buildInitialState(initialEmail, current.name));
    } catch (error) {
      push({
        kind: "error",
        title: "Questionnaire failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Onboarding Questionnaire</CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Signed-in email</label>
              <Input type="email" value={form.email} readOnly disabled />
            </div>
          </div>

          <div className="rounded-md border bg-slate-50 p-4">
            <h3 className="text-sm font-semibold">Collaboration habits and availability</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete one onboarding form. These answers are mapped into the current matching
              model while also giving Gemini richer context for profile generation.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Timezone</label>
                <Input
                  value={form.timezone}
                  onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Preferred role</label>
                <Input
                  value={form.preferredRole}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, preferredRole: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className="text-sm font-medium">Availability</label>
              <AvailabilityPicker
                value={parseAvailability(form.availabilityRaw)}
                onChange={(availability) => {
                  const raw = availability
                    .map((slot) => `${slot.day} ${slot.start}-${slot.end}`)
                    .join(", ");
                  setForm((prev) => ({ ...prev, availabilityRaw: raw }));
                }}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Strengths</label>
                <Input
                  value={form.strengthsRaw}
                  onChange={(event) => setForm((prev) => ({ ...prev, strengthsRaw: event.target.value }))}
                  placeholder="frontend, planning, research"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Growth areas</label>
                <Input
                  value={form.growthAreasRaw}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, growthAreasRaw: event.target.value }))
                  }
                  placeholder="backend, public speaking"
                  required
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Communication style</label>
                <Select
                  value={form.communicationStyle}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      communicationStyle: value as StudentIntake["communicationStyle"]
                    }))
                  }
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Collaboration preferences</label>
                <Input
                  value={form.collaborationPreferencesRaw}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      collaborationPreferencesRaw: event.target.value
                    }))
                  }
                  placeholder="shared docs, async updates"
                  required
                />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className="text-sm font-medium">Short reflection</label>
              <Textarea
                value={form.shortReflection}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, shortReflection: event.target.value }))
                }
                rows={3}
                required
              />
            </div>
          </div>

          <div className="rounded-md border bg-white p-4">
            <h3 className="text-sm font-semibold">Workload, support, and goals</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share the context that helps the AI summarize how you work best with a team.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Class priority</label>
                <Select
                  value={form.classPriority}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      classPriority: value as QuestionnaireFormState["classPriority"]
                    }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Weekly capacity hours</label>
                <Input
                  type="number"
                  min="0"
                  max="80"
                  value={form.weeklyCapacityHours}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, weeklyCapacityHours: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Schedule confidence</label>
                <Select
                  value={form.scheduleConfidence}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      scheduleConfidence: value as QuestionnaireFormState["scheduleConfidence"]
                    }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Tight</SelectItem>
                    <SelectItem value="manageable">Manageable</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Academic confidence</label>
                <Select
                  value={form.academicConfidence}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      academicConfidence: value as QuestionnaireFormState["academicConfidence"]
                    }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="needs_support">Needs support</SelectItem>
                    <SelectItem value="steady">Steady</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Leadership preference</label>
                <Select
                  value={form.leadershipPreference}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      leadershipPreference: value as QuestionnaireFormState["leadershipPreference"]
                    }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avoid">Prefer not to lead</SelectItem>
                    <SelectItem value="supporting">Support others leading</SelectItem>
                    <SelectItem value="comfortable">Comfortable leading</SelectItem>
                    <SelectItem value="prefer">Prefer to lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">External commitments</label>
                <Input
                  value={form.externalCommitments}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, externalCommitments: event.target.value }))
                  }
                  placeholder="Job, caregiving, commute, athletics"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Prior experience</label>
                <Input
                  value={form.priorExperienceRaw}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, priorExperienceRaw: event.target.value }))
                  }
                  placeholder="frontend, hackathons, tutoring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Communication habits</label>
                <Input
                  value={form.communicationHabitsRaw}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, communicationHabitsRaw: event.target.value }))
                  }
                  placeholder="responds quickly, prefers async"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Collaboration style preferences</label>
                <Input
                  value={form.collaborationStylePreferencesRaw}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      collaborationStylePreferencesRaw: event.target.value
                    }))
                  }
                  placeholder="clear ownership, early feedback"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Class goals</label>
                <Input
                  value={form.classGoalsRaw}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, classGoalsRaw: event.target.value }))
                  }
                  placeholder="ship a strong project, improve teamwork"
                />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className="text-sm font-medium">Open reflection</label>
              <Textarea
                value={form.openReflection}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, openReflection: event.target.value }))
                }
                rows={4}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit Questionnaire"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
