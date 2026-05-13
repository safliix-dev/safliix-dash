
export interface EncodingJob{
  id:string;
  title:string;
  startedAt:string;
  progress:number;
  status:string;
  type:string;
  stage?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface JobParams extends Record<string,unknown> {
  status?: string;
  limit?: number;
  offset?: number;
}