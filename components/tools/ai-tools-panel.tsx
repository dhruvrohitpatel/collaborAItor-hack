"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { AIResponseMeta } from "@/lib/ai/schemas";

type AiToolsPanelProps = {
  defaultTeamName?: string;
  defaultMembers?: string[];
  /** Communication styles from member profiles — forwarded to charter API for specific norms. */
  communicationStyles?: string[];
  /** Active risk flags — forwarded to charter API for accountability language. */
  riskFlags?: { label: string; severity: "low" | "medium" | "high" }[];
};

const rewriteToneOptions = [
  { value: "professional", label: "Professional" },
  { value: "polite", label: "Polite" },
  { value: "direct", label: "Direct" },
  { value: "encouraging", label: "Encouraging" }
] as const;

const rewriteAudienceOptions = [
  { value: "student project team", label: "Student project team" },
  { value: "a teammate", label: "A teammate" },
  { value: "an instructor", label: "Instructor" },
  { value: "a teaching assistant", label: "Teaching assistant" },
  { value: "a client or stakeholder", label: "Client or stakeholder" }
] as const;

export function AiToolsPanel({
  defaultTeamName = "Team Demo",
  defaultMembers = ["Avery", "Noah", "Mina", "Ethan"],
  communicationStyles = [],
  riskFlags = []
}: AiToolsPanelProps) {
  const { push } = useToast();
  const [charterInput, setCharterInput] = useState({
    teamName: defaultTeamName,
    members: defaultMembers.join(", "),
    projectTheme: "Course capstone"
  });
  const [charterOutput, setCharterOutput] = useState<string>("");
  const [charterMeta, setCharterMeta] = useState<AIResponseMeta | null>(null);

  const [notesInput, setNotesInput] = useState(
    "Reviewed milestone status. Need owners for integration tasks and demo narrative."
  );
  const [notesOutput, setNotesOutput] = useState<string>("");
  const [notesMeta, setNotesMeta] = useState<AIResponseMeta | null>(null);

  const [rewriteInput, setRewriteInput] = useState({
    message: "Can someone please finish their part? We are behind.",
    tone: "professional",
    audience: "student project team"
  });
  const [rewriteOutput, setRewriteOutput] = useState<string>("");
  const [rewriteMeta, setRewriteMeta] = useState<AIResponseMeta | null>(null);

  async function callApi<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed request: ${url}`);
    }

    return (await response.json()) as T;
  }

  function renderMeta(meta: AIResponseMeta | null) {
    if (!meta) {
      return null;
    }

    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <p>
          Provider: <span className="font-medium">{meta.provider}</span> | Model:{" "}
          <span className="font-medium">{meta.model}</span>
        </p>
        {meta.fallbackReason ? (
          <p className="mt-1 text-amber-700">Fallback reason: {meta.fallbackReason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Helper Widgets</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="charter" className="space-y-4">
          <TabsList>
            <TabsTrigger value="charter">Charter</TabsTrigger>
            <TabsTrigger value="meeting">Meeting Notes</TabsTrigger>
            <TabsTrigger value="rewrite">Rewrite Message</TabsTrigger>
          </TabsList>

          <TabsContent value="charter" className="space-y-3">
            <Input
              value={charterInput.teamName}
              onChange={(event) =>
                setCharterInput((prev) => ({ ...prev, teamName: event.target.value }))
              }
              placeholder="Team name"
            />
            <Input
              value={charterInput.members}
              onChange={(event) =>
                setCharterInput((prev) => ({ ...prev, members: event.target.value }))
              }
              placeholder="Member names, comma-separated"
            />
            <Input
              value={charterInput.projectTheme}
              onChange={(event) =>
                setCharterInput((prev) => ({ ...prev, projectTheme: event.target.value }))
              }
              placeholder="Project theme"
            />
            <Button
              onClick={async () => {
                try {
                  const result = await callApi<{
                    charter: string;
                    suggestedRoleRotation: string[];
                    kickoffChecklist: string[];
                    meta: AIResponseMeta;
                  }>("/api/ai/charter", {
                    teamName: charterInput.teamName,
                    memberNames: charterInput.members
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                    projectTheme: charterInput.projectTheme,
                    communicationStyles,
                    riskFlags
                  });

                  setCharterOutput(
                    [
                      result.charter,
                      "",
                      "Role Rotation:",
                      ...result.suggestedRoleRotation.map((entry) => `- ${entry}`),
                      "",
                      "Kickoff Checklist:",
                      ...result.kickoffChecklist.map((entry) => `- ${entry}`)
                    ].join("\n")
                  );
                  setCharterMeta(result.meta);
                } catch (error) {
                  push({
                    kind: "error",
                    title: "Charter generation failed",
                    description: error instanceof Error ? error.message : "Unknown error"
                  });
                }
              }}
            >
              Generate Charter
            </Button>
            {renderMeta(charterMeta)}
            <Textarea value={charterOutput} readOnly rows={10} />
          </TabsContent>

          <TabsContent value="meeting" className="space-y-3">
            <Textarea
              value={notesInput}
              onChange={(event) => setNotesInput(event.target.value)}
              rows={5}
              placeholder="Paste meeting notes"
            />
            <Button
              onClick={async () => {
                try {
                  const result = await callApi<{
                    summary: string;
                    actionItems: { task: string; owner: string }[];
                    openQuestions: string[];
                    meta: AIResponseMeta;
                  }>("/api/ai/summarize-meeting", { notes: notesInput });

                  const actionLines = result.actionItems.map(({ task, owner }) =>
                    owner ? `- [ ] ${task}  →  ${owner}` : `- [ ] ${task}`
                  );
                  const questionLines =
                    result.openQuestions.length > 0
                      ? ["", "Open Questions:", ...result.openQuestions.map((q) => `- ${q}`)]
                      : [];

                  setNotesOutput(
                    [
                      `Summary: ${result.summary}`,
                      "",
                      "Action Items:",
                      ...actionLines,
                      ...questionLines
                    ].join("\n")
                  );
                  setNotesMeta(result.meta);
                } catch (error) {
                  push({
                    kind: "error",
                    title: "Meeting summary failed",
                    description: error instanceof Error ? error.message : "Unknown error"
                  });
                }
              }}
            >
              Summarize Notes
            </Button>
            {renderMeta(notesMeta)}
            <Textarea value={notesOutput} readOnly rows={10} />
          </TabsContent>

          <TabsContent value="rewrite" className="space-y-3">
            <Textarea
              value={rewriteInput.message}
              onChange={(event) =>
                setRewriteInput((prev) => ({ ...prev, message: event.target.value }))
              }
              rows={4}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tone
                </p>
                <Select
                  value={rewriteInput.tone}
                  onValueChange={(value) =>
                    setRewriteInput((prev) => ({ ...prev, tone: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {rewriteToneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Audience
                </p>
                <Select
                  value={rewriteInput.audience}
                  onValueChange={(value) =>
                    setRewriteInput((prev) => ({ ...prev, audience: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {rewriteAudienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={async () => {
                try {
                  const result = await callApi<{
                    rewrittenMessage: string;
                    notes: string;
                    meta: AIResponseMeta;
                  }>("/api/ai/rewrite-message", {
                    message: rewriteInput.message,
                    tone: rewriteInput.tone,
                    audience: rewriteInput.audience
                  });

                  setRewriteOutput(
                    [`Rewritten:\n${result.rewrittenMessage}`, `\nNote: ${result.notes}`].join("\n")
                  );
                  setRewriteMeta(result.meta);
                } catch (error) {
                  push({
                    kind: "error",
                    title: "Rewrite failed",
                    description: error instanceof Error ? error.message : "Unknown error"
                  });
                }
              }}
            >
              Rewrite Message
            </Button>
            {renderMeta(rewriteMeta)}
            <Textarea value={rewriteOutput} readOnly rows={8} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
