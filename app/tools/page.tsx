import { AiToolsPanel } from "@/components/tools/ai-tools-panel";

export default function ToolsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Tools</h1>
        <p className="text-sm text-muted-foreground">
          Team charter generation, meeting summary extraction, and message rewriting.
        </p>
      </div>
      <AiToolsPanel />
    </div>
  );
}
