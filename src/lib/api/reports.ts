import { apiRequest } from "./client";
import { type IntroResourcesResponse, type ReportListResponse } from "@/types/api/reports";

export const reportsApi = {
  list: () => apiRequest<ReportListResponse>("/reports", {  }),
  download: (id: string, ) => apiRequest<Blob>(`/reports/${id}/download`, {  }),
};

export const introApi = {
  resources: () => apiRequest<IntroResourcesResponse>("/intro/resources", {  }),
};
