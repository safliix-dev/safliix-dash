import { apiRequest } from './client';
import type { ContentDetailStats } from '@/types/api/contentStats';
import type { ContentApiType } from '@/types/api/attachments';

export const contentStatsApi = {
  detail: (contentType: ContentApiType, id: string) =>
    apiRequest<ContentDetailStats>(
      `/admin/content/${contentType}/${id}/stats`
    ),
};
