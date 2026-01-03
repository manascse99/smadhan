import { Clock, CheckCircle, AlertTriangle, Star, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOfficerMetrics } from "@/hooks/useOfficerMetrics";
import { Skeleton } from "@/components/ui/skeleton";

const OfficerMetricsCard = () => {
  const { metrics, isLoading } = useOfficerMetrics();

  if (isLoading) {
    return (
      <Card className="gradient-card p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="gradient-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Performance Metrics</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          No metrics available for this period. Start resolving complaints to see your performance!
        </p>
      </Card>
    );
  }

  const resolutionRate = metrics.total_assigned > 0 
    ? Math.round((metrics.total_resolved / metrics.total_assigned) * 100) 
    : 0;

  const slaRate = metrics.sla_compliance_rate ?? 0;
  const avgSatisfaction = metrics.avg_satisfaction_rating ?? 0;
  const avgResolutionHours = metrics.avg_resolution_time_hours ?? 0;

  return (
    <Card className="gradient-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Performance Metrics</h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {new Date(metrics.period_start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Resolution Rate */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">Resolution Rate</span>
          </div>
          <p className="text-2xl font-bold text-secondary">{resolutionRate}%</p>
          <p className="text-xs text-muted-foreground">
            {metrics.total_resolved}/{metrics.total_assigned} resolved
          </p>
          <Progress value={resolutionRate} className="mt-2 h-1.5" />
        </div>

        {/* SLA Compliance */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">SLA Compliance</span>
          </div>
          <p className={`text-2xl font-bold ${slaRate >= 80 ? 'text-secondary' : slaRate >= 60 ? 'text-accent' : 'text-destructive'}`}>
            {slaRate.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">On-time resolutions</p>
          <Progress 
            value={slaRate} 
            className={`mt-2 h-1.5 ${slaRate >= 80 ? '' : slaRate >= 60 ? '[&>div]:bg-accent' : '[&>div]:bg-destructive'}`} 
          />
        </div>

        {/* Avg Resolution Time */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Avg Resolution</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {avgResolutionHours < 24 
              ? `${avgResolutionHours.toFixed(0)}h` 
              : `${(avgResolutionHours / 24).toFixed(1)}d`}
          </p>
          <p className="text-xs text-muted-foreground">Average time to resolve</p>
        </div>

        {/* Satisfaction Rating */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Satisfaction</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-yellow-600">{avgSatisfaction.toFixed(1)}</p>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${
                  star <= avgSatisfaction 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OfficerMetricsCard;
