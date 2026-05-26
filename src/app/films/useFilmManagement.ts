// lib/hooks/useFilmManagement.ts
import { useBaseContentManagement } from "@/lib/hooks/useBaseContentManagement";
import type { FilmListItem } from "@/types/api/films";
import type { RightsHolderContentResponse } from "@/types/api/imageRights";

// 1. On sort les fonctions pour qu'elles aient une référence stable
const getItemsFromGroup = (group: RightsHolderContentResponse): FilmListItem[] => {
  return group.movies || [];
};

const getRevenue = (film: FilmListItem): number => {
  return film.stats?.stats.revenue || 0;
};

const getCreatedAt = (film: FilmListItem): string | undefined => {
  return film.createdAt;
};

export function useFilmManagement() {
  // 2. Le hook ne fait maintenant qu'appeler la base avec des refs stables
  return useBaseContentManagement<FilmListItem>({
    contentType: "film",
    getItemsFromGroup,
    getRevenue,
    getCreatedAt,
  });
}