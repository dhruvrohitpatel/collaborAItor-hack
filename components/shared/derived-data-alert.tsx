import { cn } from "@/lib/utils";

type DerivedDataAlertProps = {
  profilesStale: boolean;
  teamsStale: boolean;
  className?: string;
};

/**
 * Explains when generated artifacts are older than the latest roster edits.
 * The warning is compact so it can be reused across instructor, profile, and
 * teams views without dominating the page.
 */
export function DerivedDataAlert({
  profilesStale,
  teamsStale,
  className
}: DerivedDataAlertProps) {
  if (!profilesStale && !teamsStale) {
    return null;
  }

  let title = "Roster changed after derived data was generated.";
  let description = "Regenerate profiles and teams before using this output for final grouping.";

  if (profilesStale && !teamsStale) {
    title = "Roster changed after profiles were generated.";
    description = "Regenerate profiles, then regenerate teams so scoring and rationale use the latest data.";
  }

  if (!profilesStale && teamsStale) {
    title = "Teams are older than the latest profile or roster data.";
    description = "Regenerate teams to refresh score summaries, rationale, and risk flags.";
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-amber-800">{description}</p>
    </div>
  );
}
