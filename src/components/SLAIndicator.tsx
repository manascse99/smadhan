import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { differenceInHours, differenceInDays, format, isPast } from "date-fns";

interface SLAIndicatorProps {
  slaDeadline: string | null;
  status: string;
  compact?: boolean;
}

const SLAIndicator = ({ slaDeadline, status, compact = false }: SLAIndicatorProps) => {
  if (!slaDeadline || status === "resolved") {
    if (status === "resolved") {
      return (
        <Badge variant="secondary" className="bg-secondary/10 text-secondary">
          <CheckCircle className="w-3 h-3 mr-1" />
          {compact ? "Done" : "Resolved"}
        </Badge>
      );
    }
    return null;
  }

  const deadline = new Date(slaDeadline);
  const now = new Date();
  const hoursRemaining = differenceInHours(deadline, now);
  const daysRemaining = differenceInDays(deadline, now);
  const isOverdue = isPast(deadline);
  const isUrgent = !isOverdue && hoursRemaining <= 24;
  const isWarning = !isOverdue && !isUrgent && hoursRemaining <= 72;

  const getStatusConfig = () => {
    if (isOverdue) {
      return {
        icon: AlertTriangle,
        label: compact ? "Overdue" : `Overdue by ${Math.abs(daysRemaining)} day(s)`,
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    }
    if (isUrgent) {
      return {
        icon: Clock,
        label: compact ? `${hoursRemaining}h` : `${hoursRemaining} hours left`,
        className: "bg-[hsl(var(--status-processing))]/10 text-[hsl(var(--status-processing))] border-[hsl(var(--status-processing))]/20",
      };
    }
    if (isWarning) {
      return {
        icon: Clock,
        label: compact ? `${daysRemaining}d` : `${daysRemaining} days left`,
        className: "bg-accent/10 text-accent border-accent/20",
      };
    }
    return {
      icon: Clock,
      label: compact ? `${daysRemaining}d` : `${daysRemaining} days remaining`,
      className: "bg-muted text-muted-foreground",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`${config.className} cursor-help`}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">
          SLA Deadline: {format(deadline, "PPP 'at' p")}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SLAIndicator;
