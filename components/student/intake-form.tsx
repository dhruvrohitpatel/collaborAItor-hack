"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { AvailabilityPicker } from "@/components/student/availability-picker";
import {
  parseAvailabilityText,
  parseCommaSeparatedList,
  stringifyAvailability
} from "@/lib/student-intake";
import type { StudentIntake } from "@/types/domain";

const communicationStyles = [
  { value: "direct", label: "Direct" },
  { value: "collaborative", label: "Collaborative" },
  { value: "reflective", label: "Reflective" },
  { value: "facilitative", label: "Facilitative" },
  { value: "analytical", label: "Analytical" }
] as const;

type FormState = {
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
};

const initialState: FormState = {
  name: "",
  email: "",
  timezone: "America/Phoenix",
  availabilityRaw: "Mon 16:00-18:00, Wed 17:00-19:00",
  strengthsRaw: "",
  growthAreasRaw: "",
  preferredRole: "",
  communicationStyle: "collaborative",
  collaborationPreferencesRaw: "",
  shortReflection: ""
};

export function StudentIntakeForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  const generatedId = useMemo(() => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug ? `stu-${slug.slice(0, 16)}` : "stu-new";
  }, [form.name]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload: StudentIntake = {
        id: generatedId,
        name: form.name,
        email: form.email,
        timezone: form.timezone,
        availability: parseAvailabilityText(form.availabilityRaw),
        strengths: parseCommaSeparatedList(form.strengthsRaw),
        growthAreas: parseCommaSeparatedList(form.growthAreasRaw),
        preferredRole: form.preferredRole,
        communicationStyle: form.communicationStyle,
        collaborationPreferences: parseCommaSeparatedList(form.collaborationPreferencesRaw),
        shortReflection: form.shortReflection
      };

      const response = await fetch("/api/student/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to submit intake");
      }

      push({
        kind: "success",
        title: "Intake submitted",
        description: `${payload.name} is now available in instructor roster.`
      });
      setForm(initialState);
    } catch (error) {
      push({
        kind: "error",
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Collaboration Intake</CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Row 1: Name & Email */}
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
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
          </div>

          {/* Row 2: Timezone & Preferred Role */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={form.timezone}
                onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Preferred Role</label>
              <Input
                value={form.preferredRole}
                onChange={(event) => setForm((prev) => ({ ...prev, preferredRole: event.target.value }))}
                required
              />
            </div>
          </div>

          {/* Row 3: Availability (full width) */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Availability</label>
            <AvailabilityPicker
              value={parseAvailabilityText(form.availabilityRaw)}
              onChange={(availability) => {
                setForm((prev) => ({
                  ...prev,
                  availabilityRaw: stringifyAvailability(availability)
                }));
              }}
            />
          </div>

          {/* Row 4: Strengths & Growth Areas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Strengths (comma-separated)</label>
              <Input
                value={form.strengthsRaw}
                onChange={(event) => setForm((prev) => ({ ...prev, strengthsRaw: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Growth Areas (comma-separated)</label>
              <Input
                value={form.growthAreasRaw}
                onChange={(event) => setForm((prev) => ({ ...prev, growthAreasRaw: event.target.value }))}
                required
              />
            </div>
          </div>

          {/* Row 5: Communication Style & Collaboration Preferences */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Communication Style</label>
              <Select
                value={form.communicationStyle || "collaborative"}
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
              <label className="text-sm font-medium">Collaboration Preferences</label>
              <Input
                value={form.collaborationPreferencesRaw}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, collaborationPreferencesRaw: event.target.value }))
                }
                placeholder="shared docs, async updates"
                required
              />
            </div>
          </div>

          {/* Row 6: Short Reflection (full width) */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Short Reflection</label>
            <Textarea
              value={form.shortReflection}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, shortReflection: event.target.value }))
              }
              rows={4}
              required
            />
          </div>

          {/* Submit Button */}
          <div>
            <Button type="submit" disabled={saving}>
              {saving ? "Submitting..." : "Submit Intake"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
