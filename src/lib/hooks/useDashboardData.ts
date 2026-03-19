import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api/dashboard";
import {
  type DashboardHighlightsResponse,
  type DashboardMetricsResponse,
  type DashboardRepartitionResponse,
} from "@/types/api/dashboard";
import { formatApiError } from "@/lib/api/errors";
import { withRetry } from "@/lib/api/retry";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { useSession } from "next-auth/react";

interface DashboardData {
  metrics: DashboardMetricsResponse | null;
  highlights: DashboardHighlightsResponse | null;
  repartition: DashboardRepartitionResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): DashboardData {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [highlights, setHighlights] = useState<DashboardHighlightsResponse | null>(null);
  const [repartition, setRepartition] = useState<DashboardRepartitionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const toast = useToast();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [metricsRes, highlightsRes, repartitionRes] = await withRetry(
          () =>
            Promise.all([
              dashboardApi.getMetrics(undefined, controller.signal, accessToken),
              dashboardApi.getHighlights(controller.signal, accessToken),
              dashboardApi.getRepartition(undefined, controller.signal, accessToken),
            ]),
          { retries: 2, delayMs: 300, signal: controller.signal },
        );
        if (cancelled) return;
        setMetrics(metricsRes);
        setHighlights(highlightsRes);
        setRepartition(repartitionRes);
      } catch (err) {
        console.log("Error fetching dashboard data", err);
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({
          title: "Dashboard",
          description: friendly.message,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [nonce, accessToken]);

  return {
    metrics,
    highlights,
    repartition,
    loading,
    error,
    refetch: () => setNonce((x) => x + 1),
  };
}
