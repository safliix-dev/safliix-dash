
import { apiRequest } from "./client";
import { EncodingJob,JobParams } from "@/types/api/job";

export const jobApi = {
  list: (params: JobParams, accessToken?: string) =>
    apiRequest<EncodingJob[]>("/jobs/active", { params, accessToken }),

  resume:(jobId:string,accessToken?:string) =>
    apiRequest<boolean>(`/jobs/resume/${jobId}`,{accessToken}),

  pause:(jobId:string,accessToken?:string) =>
    apiRequest<boolean>(`/jobs/resume/${jobId}`,{accessToken}),

  retry:(jobId:string,accessToken?:string) =>
    apiRequest<boolean>(`/jobs/resume/${jobId}`,{accessToken}),

};
