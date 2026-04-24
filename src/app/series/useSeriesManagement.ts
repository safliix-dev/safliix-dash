// lib/hooks/useSeriesManagement.ts
import { useBaseContentManagement } from "@/lib/hooks/useBaseContentManagement";
import type { SeriesListItem } from "@/types/api/series";
import type { RightsHolderContentResponse } from "@/types/api/imageRights";

export function useSeriesManagement() {
  const getItemsFromGroup = (group: RightsHolderContentResponse): SeriesListItem[] => {
    return group.series || [];
  };

  const getRevenue = (series: SeriesListItem): number => {
    return series.stats?.revenue || 0;
  };

  const getCreatedAt = (series: SeriesListItem): string | undefined => {
    return series.createdAt;
  };

  return useBaseContentManagement<SeriesListItem>({
    contentType: "serie",
    getItemsFromGroup,
    getRevenue,
    getCreatedAt,
  });
}