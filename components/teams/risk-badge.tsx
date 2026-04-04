import { Badge } from "@/components/ui/badge";
import type { RiskFlag } from "@/types/domain";

export function RiskBadge({ risk }: { risk: RiskFlag }) {
  const variant =
    risk.severity === "high"
      ? "danger"
      : risk.severity === "medium"
        ? "warning"
        : "secondary";

  return <Badge variant={variant}>{risk.label}</Badge>;
}
