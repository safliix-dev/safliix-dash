// lib/hooks/useFilmManagement.ts
import { useBaseContentManagement } from "@/lib/hooks/useBaseContentManagement";
import type { FilmListItem } from "@/types/api/films";
import type { RightsHolderContentResponse } from "@/types/api/imageRights";

export function useFilmManagement() {
  const getItemsFromGroup = (group: RightsHolderContentResponse): FilmListItem[] => {
    return group.movies || [];
  };

  const getRevenue = (film: FilmListItem): number => {
    if (!film.stats) return 0;
    return film.stats.stats.revenue;
  };

  const getCreatedAt = (film: FilmListItem): string | undefined => {
    return film.createdAt;
  };

  return useBaseContentManagement<FilmListItem>({
    contentType: "movie",
    getItemsFromGroup,
    getRevenue,
    getCreatedAt,
  });
}