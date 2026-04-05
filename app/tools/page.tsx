import { AiToolsPanel } from "@/components/tools/ai-tools-panel";
import { requireInstructorPage } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  await requireInstructorPage();
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
