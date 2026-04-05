"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { AIResponseMeta } from "@/lib/ai/schemas";

type AiToolsPanelProps = {
  defaultTeamName?: string;
  defaultMembers?: string[];
  communicationStyles?: string[];
  riskFlags?: { label: string; severity: "low" | "medium" | "high" }[];
};

// ─── Tone options ─────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Neutral and formal" },
  { value: "polite", label: "Polite", desc: "Warm and respectful" },
  { value: "direct", label: "Direct", desc: "Clear and concise" },
  { value: "encouraging", label: "Encouraging", desc: "Positive and motivating" },
];

// ─── Section label ────────────────────────────────────────────────────────────

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Meta pill ────────────────────────────────────────────────────────────────

function MetaPill({ meta }: { meta: AIResponseMeta | null }) {
  if (!meta) return null;
  const isMock = meta.provider === "mock" || !!meta.fallbackReason;
  return (
    <div className={[
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
      isMock
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700"
    ].join(" ")}>
      <span className={`h-1.5 w-1.5 rounded-full ${isMock ? "bg-amber-400" : "bg-emerald-400"}`} />
      {isMock ? "Mock fallback" : `Gemini · ${meta.model}`}
      {meta.fallbackReason && <span className="opacity-70">— {meta.fallbackReason}</span>}
    </div>
  );
}

// ─── Output box ───────────────────────────────────────────────────────────────

function OutputBox({ value }: { value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Output</p>
      <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">{value}</pre>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [charterOutput, setCharterOutput] = useState("");
  const [charterMeta, setCharterMeta] = useState<AIResponseMeta | null>(null);
  const [charterLoading, setCharterLoading] = useState(false);

  const [notesInput, setNotesInput] = useState(
    "Reviewed milestone status. Need owners for integration tasks and demo narrative."
  );
  const [notesOutput, setNotesOutput] = useState("");
  const [notesMeta, setNotesMeta] = useState<AIResponseMeta | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesAudioUrl, setNotesAudioUrl] = useState<string | null>(null);
  const [notesAudioLoading, setNotesAudioLoading] = useState(false);

  const [rewriteInput, setRewriteInput] = useState({
    message: "Can someone please finish their part? We are behind.",
    tone: "professional",
    audience: "student project team"
  });
  const [rewriteOutput, setRewriteOutput] = useState("");
  const [rewriteMeta, setRewriteMeta] = useState<AIResponseMeta | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (notesAudioUrl) {
        URL.revokeObjectURL(notesAudioUrl);
      }
    };
  }, [notesAudioUrl]);

  async function callApi<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Failed request: ${url}`);
    return (await response.json()) as T;
  }

  async function handleCharter() {
    setCharterLoading(true);
    try {
      const result = await callApi<{
        charter: string;
        suggestedRoleRotation: string[];
        kickoffChecklist: string[];
        meta: AIResponseMeta;
      }>("/api/ai/charter", {
        teamName: charterInput.teamName,
        memberNames: charterInput.members.split(",").map((v) => v.trim()).filter(Boolean),
        projectTheme: charterInput.projectTheme,
        communicationStyles,
        riskFlags
      });
      setCharterOutput([
        result.charter, "",
        "Role Rotation:",
        ...result.suggestedRoleRotation.map((e) => `- ${e}`), "",
        "Kickoff Checklist:",
        ...result.kickoffChecklist.map((e) => `- ${e}`)
      ].join("\n"));
      setCharterMeta(result.meta);
    } catch (error) {
      push({ kind: "error", title: "Charter generation failed", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setCharterLoading(false);
    }
  }

  async function handleNotes() {
    setNotesLoading(true);
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
      const questionLines = result.openQuestions.length > 0
        ? ["", "Open Questions:", ...result.openQuestions.map((q) => `- ${q}`)]
        : [];

      setNotesOutput([
        `Summary: ${result.summary}`, "",
        "Action Items:", ...actionLines,
        ...questionLines
      ].join("\n"));
      setNotesMeta(result.meta);
    } catch (error) {
      push({ kind: "error", title: "Meeting summary failed", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleNotesAudio() {
    setNotesAudioLoading(true);

    try {
      const response = await fetch("/api/ai/summarize-meeting-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesInput })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to generate audio summary.");
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);

      setNotesAudioUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return nextUrl;
      });
    } catch (error) {
      push({
        kind: "error",
        title: "Audio summary failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setNotesAudioLoading(false);
    }
  }

  async function handleRewrite() {
    setRewriteLoading(true);
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
      setRewriteOutput([
        `Rewritten:\n${result.rewrittenMessage}`,
        `\nNote: ${result.notes}`
      ].join("\n"));
      setRewriteMeta(result.meta);
    } catch (error) {
      push({ kind: "error", title: "Rewrite failed", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setRewriteLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>AI Helper Widgets</CardTitle>
        <p className="text-sm text-slate-400">
          Generate team charters, extract action items from meeting notes, and rewrite messages.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="charter" className="space-y-5">
          <TabsList className="w-full">
            <TabsTrigger value="charter" className="flex-1">Charter</TabsTrigger>
            <TabsTrigger value="meeting" className="flex-1">Meeting Notes</TabsTrigger>
            <TabsTrigger value="rewrite" className="flex-1">Rewrite Message</TabsTrigger>
          </TabsList>

          {/* ── Charter ── */}
          <TabsContent value="charter" className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div>
                <FieldLabel label="Team name" />
                <Input
                  value={charterInput.teamName}
                  onChange={(e) => setCharterInput((p) => ({ ...p, teamName: e.target.value }))}
                  placeholder="e.g. Team Alpha"
                />
              </div>
              <div>
                <FieldLabel label="Members" hint="Comma-separated names" />
                <Input
                  value={charterInput.members}
                  onChange={(e) => setCharterInput((p) => ({ ...p, members: e.target.value }))}
                  placeholder="Avery, Noah, Mina, Ethan"
                />
              </div>
              <div>
                <FieldLabel label="Project theme" />
                <Input
                  value={charterInput.projectTheme}
                  onChange={(e) => setCharterInput((p) => ({ ...p, projectTheme: e.target.value }))}
                  placeholder="e.g. Course capstone"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button onClick={handleCharter} disabled={charterLoading}>
                {charterLoading ? "Generating..." : "Generate Charter"}
              </Button>
              <MetaPill meta={charterMeta} />
            </div>
            <OutputBox value={charterOutput} />
          </TabsContent>

          {/* ── Meeting Notes ── */}
          <TabsContent value="meeting" className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <FieldLabel label="Meeting notes" hint="Paste raw notes — we'll extract a summary, action items, and open questions." />
              <Textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                rows={6}
                placeholder="e.g. Reviewed milestone status. Alex will fix the auth bug. Still unclear on deployment target."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleNotes} disabled={notesLoading}>
                  {notesLoading ? "Summarizing..." : "Summarize Notes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNotesAudio}
                  disabled={notesAudioLoading || notesInput.trim().length < 10}
                >
                  {notesAudioLoading ? "Generating Audio..." : "Hear Summary"}
                </Button>
              </div>
              <MetaPill meta={notesMeta} />
            </div>
            <OutputBox value={notesOutput} />
            {notesAudioUrl ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Audio Summary
                </p>
                <audio controls className="w-full" src={notesAudioUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : null}
          </TabsContent>

          {/* ── Rewrite Message ── */}
          <TabsContent value="rewrite" className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div>
                <FieldLabel label="Original message" hint="Paste a rough or tense message to rewrite." />
                <Textarea
                  value={rewriteInput.message}
                  onChange={(e) => setRewriteInput((p) => ({ ...p, message: e.target.value }))}
                  rows={4}
                  placeholder="e.g. Can someone please finish their part? We are behind."
                />
              </div>

              <div>
                <FieldLabel label="Tone" />
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((t) => {
                    const active = rewriteInput.tone === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setRewriteInput((p) => ({ ...p, tone: t.value }))}
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                          active
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                        ].join(" ")}
                      >
                        {t.label}
                        <span className={`ml-1 ${active ? "text-blue-100" : "text-gray-400"}`}>
                          — {t.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <FieldLabel label="Audience" hint="Who the rewritten message is for." />
                <Input
                  value={rewriteInput.audience}
                  onChange={(e) => setRewriteInput((p) => ({ ...p, audience: e.target.value }))}
                  placeholder="e.g. student project team"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button onClick={handleRewrite} disabled={rewriteLoading}>
                {rewriteLoading ? "Rewriting..." : "Rewrite Message"}
              </Button>
              <MetaPill meta={rewriteMeta} />
            </div>
            <OutputBox value={rewriteOutput} />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
