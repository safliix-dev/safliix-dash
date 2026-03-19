
export interface EncodingJob{
  id:string;
  title:string;
  startedAt:string;
  progress:number;
  status:string;
}

export interface JobParams {
  status?: string;
  type: string;
  limit?: number;
  offset?: number;
}