"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type AiToolsPanelProps = {
  defaultTeamName?: string;
  defaultMembers?: string[];
  /** Communication styles from member profiles — forwarded to charter API for specific norms. */
  communicationStyles?: string[];
  /** Active risk flags — forwarded to charter API for accountability language. */
  riskFlags?: { label: string; severity: "low" | "medium" | "high" }[];
};

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

  const [notesInput, setNotesInput] = useState(
    "Reviewed milestone status. Need owners for integration tasks and demo narrative."
  );
  const [notesOutput, setNotesOutput] = useState<string>("");

  const [rewriteInput, setRewriteInput] = useState({
    message: "Can someone please finish their part? We are behind.",
    tone: "professional",
    audience: "student project team"
  });
  const [rewriteOutput, setRewriteOutput] = useState<string>("");

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
                    actionItems: string[];
                    ownersNeeded: string[];
                  }>("/api/ai/summarize-meeting", { notes: notesInput });

                  setNotesOutput(
                    [
                      `Summary: ${result.summary}`,
                      "",
                      "Action Items:",
                      ...result.actionItems.map((entry) => `- ${entry}`),
                      "",
                      "Owners Needed:",
                      ...result.ownersNeeded.map((entry) => `- ${entry}`)
                    ].join("\n")
                  );
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
              <Input
                value={rewriteInput.tone}
                onChange={(event) =>
                  setRewriteInput((prev) => ({ ...prev, tone: event.target.value }))
                }
                placeholder="Tone"
              />
              <Input
                value={rewriteInput.audience}
                onChange={(event) =>
                  setRewriteInput((prev) => ({ ...prev, audience: event.target.value }))
                }
                placeholder="Audience"
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  const result = await callApi<{
                    rewrittenMessage: string;
                    notes: string;
                  }>("/api/ai/rewrite-message", {
                    message: rewriteInput.message,
                    tone: rewriteInput.tone,
                    audience: rewriteInput.audience
                  });

                  setRewriteOutput(`${result.rewrittenMessage}\n\nNotes: ${result.notes}`);
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
            <Textarea value={rewriteOutput} readOnly rows={8} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
