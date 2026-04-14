
export interface EncodingJob{
  id:string;
  title:string;
  startedAt:string;
  progress:number;
  status:string;
  type:string;
}

export interface JobParams extends Record<string,unknown> {
  status?: string;
  limit?: number;
  offset?: number;
}