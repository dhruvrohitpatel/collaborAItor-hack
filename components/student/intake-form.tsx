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
  stringifyAvailability
} from "@/lib/student-intake";
import type { StudentIntake } from "@/types/domain";

const STRENGTH_CHIPS = [
  "Frontend", "Backend", "Testing", "Documentation",
  "Design", "Coordination", "Research", "Data Analysis", "DevOps", "Presentation"
];

const GROWTH_CHIPS = [
  "Frontend", "Backend", "Testing", "Documentation",
  "Design", "Coordination", "Research", "Data Analysis", "DevOps", "Presentation"
];

const COLLAB_PREF_CHIPS = [
  "Shared docs", "Async updates", "Daily standups",
  "Pair programming", "Code reviews", "Weekly syncs", "Slack / messaging", "Video calls"
];

const PREFERRED_ROLES = [
  { value: "implementer", label: "Implementer", desc: "Writes the core code and features" },
  { value: "tester", label: "Tester / QA", desc: "Ensures quality and finds bugs" },
  { value: "coordinator", label: "Coordinator", desc: "Manages tasks and keeps team aligned" },
  { value: "designer", label: "Designer", desc: "Owns UX, visuals, and documentation" },
  { value: "researcher", label: "Researcher", desc: "Investigates options and informs decisions" },
  { value: "flexible", label: "Flexible", desc: "Happy to take on whatever the team needs" },
];

const COMM_STYLES = [
  { value: "direct", label: "Direct", desc: "Clear, concise, gets to the point fast" },
  { value: "collaborative", label: "Collaborative", desc: "Discusses openly, builds on others' ideas" },
  { value: "reflective", label: "Reflective", desc: "Thinks before responding, prefers async" },
  { value: "facilitative", label: "Facilitative", desc: "Keeps conversations moving, draws others in" },
  { value: "analytical", label: "Analytical", desc: "Data-driven, structured, methodical" },
];

const REFLECTION_MAX = 500;

function ChipSelector({
  options, selected, onChange, max,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  function toggle(chip: string) {
    if (selected.includes(chip)) {
      onChange(selected.filter((s) => s !== chip));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, chip]);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((chip) => {
        const active = selected.includes(chip);
        const atMax = !!max && selected.length >= max && !active;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => toggle(chip)}
            disabled={atMax}
            className={[
              "rounded-full border px-3 py-1 text-sm font-medium transition-all",
              active
                ? "border-blue-500 bg-blue-500 text-white"
                : atMax
                ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
            ].join(" ")}
          >
            {active ? "✓ " : ""}{chip}
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

type FormState = {
  name: string;
  email: string;
  timezone: string;
  availabilityRaw: string;
  strengths: string[];
  growthAreas: string[];
  preferredRole: string;
  communicationStyle: StudentIntake["communicationStyle"];
  collaborationPreferences: string[];
  shortReflection: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  timezone: "America/Phoenix",
  availabilityRaw: "",
  strengths: [],
  growthAreas: [],
  preferredRole: "",
  communicationStyle: "collaborative",
  collaborationPreferences: [],
  shortReflection: "",
};

export function StudentIntakeForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  const generatedId = useMemo(() => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug ? `stu-${slug.slice(0, 16)}` : "stu-new";
  }, [form.name]);

  const reflectionCharsLeft = REFLECTION_MAX - form.shortReflection.length;

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
        strengths: form.strengths,
        growthAreas: form.growthAreas,
        preferredRole: form.preferredRole,
        communicationStyle: form.communicationStyle,
        collaborationPreferences: form.collaborationPreferences,
        shortReflection: form.shortReflection,
      };

      const response = await fetch("/api/student/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to submit intake");

      push({
        kind: "success",
        title: "Intake submitted",
        description: `${payload.name} is now available in the instructor roster.`,
      });
      setForm(initialState);
    } catch (error) {
      push({
        kind: "error",
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Student Collaboration Intake</CardTitle>
        <p className="text-sm text-slate-400">
          Takes about 3 minutes. Your answers help form a balanced, fair team.
        </p>
      </CardHeader>

      <CardContent className="overflow-visible">
        <form onSubmit={onSubmit} className="space-y-8">

          {/* About you */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">About you</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Full name</label>
                <Input
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  placeholder="you@asu.edu"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Timezone</label>
                <p className="text-xs text-slate-400">Enter your IANA timezone so we can align meeting suggestions.</p>
                <Input
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Preferred role</label>
                <p className="text-xs text-slate-400">Tell us your preferred team role for collaboration planning.</p>
                <Select
                  value={form.preferredRole}
                  onValueChange={(v) => setForm((p) => ({ ...p, preferredRole: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFERRED_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="font-medium">{r.label}</span>
                        <span className="text-slate-400 ml-2 text-xs">{r.desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Availability</p>
            <AvailabilityPicker
              value={parseAvailabilityText(form.availabilityRaw)}
              onChange={(availability) =>
                setForm((p) => ({ ...p, availabilityRaw: stringifyAvailability(availability) }))
              }
            />
          </div>

          {/* Skills */}
          <div className="space-y-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Skills &amp; growth</p>
            <Section title="Your strengths" hint="Select up to 4 areas you feel confident in.">
              <ChipSelector
                options={STRENGTH_CHIPS}
                selected={form.strengths}
                onChange={(v) => setForm((p) => ({ ...p, strengths: v }))}
                max={4}
              />
              {form.strengths.length === 0 && (
                <p className="text-xs text-slate-400">Nothing selected yet.</p>
              )}
            </Section>
            <Section title="Growth areas" hint="Select up to 2 areas you want to develop during this project.">
              <ChipSelector
                options={GROWTH_CHIPS}
                selected={form.growthAreas}
                onChange={(v) => setForm((p) => ({ ...p, growthAreas: v }))}
                max={2}
              />
              {form.growthAreas.length === 0 && (
                <p className="text-xs text-slate-400">Nothing selected yet.</p>
              )}
            </Section>
          </div>

          {/* Working style */}
          <div className="space-y-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Working style</p>
            <Section title="Communication style" hint="How do you naturally communicate with teammates?">
              <Select
                value={form.communicationStyle}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, communicationStyle: v as StudentIntake["communicationStyle"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  {COMM_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="font-medium">{s.label}</span>
                      <span className="text-slate-400 ml-2 text-xs">{s.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>
            <Section title="Collaboration preferences" hint="How do you like to coordinate with your team? Select all that apply.">
              <ChipSelector
                options={COLLAB_PREF_CHIPS}
                selected={form.collaborationPreferences}
                onChange={(v) => setForm((p) => ({ ...p, collaborationPreferences: v }))}
              />
            </Section>
          </div>

          {/* Reflection */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reflection</p>
            <Section
              title="Short reflection"
              hint="Describe your working style, what you bring to a team, and what you need from teammates."
            >
              <div className="relative">
                <Textarea
                  value={form.shortReflection}
                  onChange={(e) => {
                    if (e.target.value.length <= REFLECTION_MAX) {
                      setForm((p) => ({ ...p, shortReflection: e.target.value }));
                    }
                  }}
                  rows={5}
                  placeholder="e.g. I tend to work async and prefer clear written specs before starting. I'm strongest at backend work but want to practice coordination this semester. I do my best thinking in the morning and appreciate teammates who communicate blockers early."
                  required
                />
                <span className={[
                  "absolute bottom-2 right-3 text-xs",
                  reflectionCharsLeft < 50 ? "text-amber-500" : "text-slate-300"
                ].join(" ")}>
                  {reflectionCharsLeft} left
                </span>
              </div>
            </Section>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Your data is used only for team formation and is not shared externally.
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? "Submitting..." : "Submit Intake"}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}