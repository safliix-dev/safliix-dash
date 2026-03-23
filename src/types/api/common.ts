export interface PageInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface TimeRangeParams extends Record<string,unknown> {
  from?: string;
  to?: string;
  range?: string;
}
