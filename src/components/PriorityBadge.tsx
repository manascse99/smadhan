import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "critical" | null;
  showLabel?: boolean;
}

const PriorityBadge = ({ priority, showLabel = true }: PriorityBadgeProps) => {
  if (!priority) return null;

  const config = {
    critical: {
      icon: AlertTriangle,
      label: "Critical",
      className: "bg-destructive text-destructive-foreground",
    },
    high: {
      icon: ArrowUp,
      label: "High",
      className: "bg-[hsl(var(--status-processing))] text-white",
    },
    medium: {
      icon: Minus,
      label: "Medium",
      className: "bg-accent text-accent-foreground",
    },
    low: {
      icon: ArrowDown,
      label: "Low",
      className: "bg-muted text-muted-foreground",
    },
  };

  const { icon: Icon, label, className } = config[priority];

  return (
    <Badge className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {showLabel && label}
    </Badge>
  );
};

export default PriorityBadge;
