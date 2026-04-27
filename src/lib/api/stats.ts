import { apiRequest } from "./client";
import {
  type FilmsStatsResponse,
  type PubStatsDetail,
  type PubStatsResponse,
  type RevenueStatsResponse,
  type StatsQueryParams,
  type UsersStatsResponse,
} from "@/types/api/stats";

export const statsApi = {
  films: (params?: StatsQueryParams, ) =>
    apiRequest<FilmsStatsResponse>("/dashboard/stats/films", { params,  }),

  revenue: (params?: StatsQueryParams, ) =>
    apiRequest<RevenueStatsResponse>("/dashboard/stats/revenue", { params,  }),

  users: (params?: StatsQueryParams, ) =>
    apiRequest<UsersStatsResponse>("/dashboard/stats/users", { params,  }),

  pub: (params?: StatsQueryParams, ) =>
    apiRequest<PubStatsResponse>("/dashboard/stats/pub", { params,  }),

  pubDetail: (id: string, ) =>
    apiRequest<PubStatsDetail>(`/dashboard/stats/pub/${id}`, {  }),
};
