import { apiRequest } from './client';
import type { ContentAttachment, ContentApiType } from '@/types/api/attachments';

export const attachmentsApi = {
  list: (contentType: ContentApiType, id: string) =>
    apiRequest<ContentAttachment[]>(
      `/admin/content/${contentType}/${id}/attachments`
    ),

  delete: (contentType: ContentApiType, id: string, attachmentType: string) =>
    apiRequest<{ ok: boolean }>(
      `/admin/content/${contentType}/${id}/attachments/${attachmentType}`,
      { method: 'DELETE' }
    ),
};
