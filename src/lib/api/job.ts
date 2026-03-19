
import { apiRequest } from "./client";
import { EncodingJob,JobParams } from "@/types/api/job";

export const jobApi = {
  list: (params: JobParams, accessToken?: string) =>
    apiRequest<EncodingJob[]>("/jobs/active", { params, accessToken }),

};
