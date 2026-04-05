"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type RosterFormState = {
  name: string;
  email: string;
  section: string;
  cohort: string;
};

const initialState: RosterFormState = {
  name: "",
  email: "",
  section: "",
  cohort: ""
};

export function RosterSetupForm() {
  const [form, setForm] = useState<RosterFormState>(initialState);
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  const preview = useMemo(() => {
    return [form.section, form.cohort].filter(Boolean).join(" • ") || "No section/cohort yet";
  }, [form.cohort, form.section]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/instructor/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          section: form.section || undefined,
          cohort: form.cohort || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save roster student");
      }

      push({
        kind: "success",
        title: "Roster student saved",
        description: `${form.name} is ready for questionnaire completion.`
      });
      setForm(initialState);
    } catch (error) {
      push({
        kind: "error",
        title: "Roster save failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Roster Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Student name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Student email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Section</label>
              <Input
                value={form.section}
                onChange={(event) => setForm((prev) => ({ ...prev, section: event.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cohort</label>
              <Input
                value={form.cohort}
                onChange={(event) => setForm((prev) => ({ ...prev, cohort: event.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="rounded-md border bg-slate-50 p-3 text-sm text-muted-foreground">
            This creates a lightweight roster record now. The student can add deeper collaboration
            and workload context later from the questionnaire flow.
            <div className="mt-2 text-xs">Current roster preview: {preview}</div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Roster Student"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
