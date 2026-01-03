import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OfficerMetrics {
  id: string;
  officer_id: string;
  total_assigned: number;
  total_resolved: number;
  avg_resolution_time_hours: number | null;
  sla_compliance_rate: number | null;
  avg_satisfaction_rating: number | null;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export const useOfficerMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OfficerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;

      try {
        // Get current month's metrics
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        // Use type assertion since the table was just created
        const { data, error } = await supabase
          .from("officer_metrics" as any)
          .select("*")
          .eq("officer_id", user.id)
          .gte("period_start", periodStart)
          .lte("period_end", periodEnd)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setMetrics({
            id: (data as any).id,
            officer_id: (data as any).officer_id,
            total_assigned: (data as any).total_assigned,
            total_resolved: (data as any).total_resolved,
            avg_resolution_time_hours: (data as any).avg_resolution_time_hours,
            sla_compliance_rate: (data as any).sla_compliance_rate,
            avg_satisfaction_rating: (data as any).avg_satisfaction_rating,
            period_start: (data as any).period_start,
            period_end: (data as any).period_end,
            created_at: (data as any).created_at,
            updated_at: (data as any).updated_at,
          });
        }
      } catch (error) {
        console.error("Error fetching officer metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  return { metrics, isLoading };
};
