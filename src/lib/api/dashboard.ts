import { apiRequest } from "./client";
import {
  type DashboardHighlightsResponse,
  type DashboardMetricsParams,
  type DashboardMetricsResponse,
  type DashboardRepartitionParams,
  type DashboardRepartitionResponse,
} from "@/types/api/dashboard";

export const dashboardApi = {
  getMetrics: (params?: DashboardMetricsParams, signal?: AbortSignal, ) =>
    apiRequest<DashboardMetricsResponse>("/dashboard/metrics", { params, signal,  }),

  getHighlights: (signal?: AbortSignal, ) =>
    apiRequest<DashboardHighlightsResponse>("/dashboard/highlights", { signal,  }),

  getRepartition: (params?: DashboardRepartitionParams, signal?: AbortSignal, ) =>
    apiRequest<DashboardRepartitionResponse>("/dashboard/repartition", { params, signal,  }),
};
