
import { apiRequest } from "./client";
import { EncodingJob,JobParams } from "@/types/api/job";

export const jobApi = {
  list: (params: JobParams) =>
    apiRequest<EncodingJob[]>("/jobs/active", { params,  }),

  resume:(jobId:string) =>
    apiRequest<boolean>(`/jobs/resume/${jobId}`,{}),

  pause:(jobId:string) =>
    apiRequest<boolean>(`/jobs/resume/${jobId}`,{}),

  retry:(jobId:string) =>
    apiRequest<boolean>(`/jobs/resume/${jobId}`,{}),

};
