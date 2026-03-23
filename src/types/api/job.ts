
export interface EncodingJob{
  id:string;
  title:string;
  startedAt:string;
  progress:number;
  status:string;
}

export interface JobParams extends Record<string,unknown> {
  status?: string;
  type: string;
  limit?: number;
  offset?: number;
}