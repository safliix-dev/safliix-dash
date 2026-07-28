// lib/hooks/useBaseContentManagement.ts
import { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { formatApiError } from "@/lib/api/errors";
import { imageRightsApi } from "@/lib/api/imageRights";
import type { RightsHolderContentResponse } from "@/types/api/imageRights";
import type { ContentStatus } from "@/types/api/common";

export type DistributionMode = "location" | "abonnement";
export type SortOption = "none" | "best" | "latest";

// Configuration des statuts
export const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; order: number }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-500", order: 0 },
  PROCESSING: { label: "Traitement", color: "bg-yellow-500", order: 1 },
  PROCESSED: { label: "Traité", color: "bg-blue-500", order: 2 },
  PUBLISHED: { label: "Publié", color: "bg-green-500", order: 3 },
  ARCHIVED: { label: "Archivé", color: "bg-red-500", order: 4 },
};

export interface StatusFilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilteredGroup<T> {
  id: string;
  firstName: string;
  lastName: string;
  items: T[];
}

export type ContentType = "movie" | "serie";

interface UseBaseContentManagementParams<T> {
  contentType: ContentType;
  getItemsFromGroup: (group: RightsHolderContentResponse) => T[];
  getRevenue: (item: T) => number;
  getCreatedAt: (item: T) => string | undefined;
}

export function useBaseContentManagement<T extends { status: ContentStatus; type?: DistributionMode }>({
  contentType,
  getItemsFromGroup,
  getRevenue,
  getCreatedAt,
}: UseBaseContentManagementParams<T>) {
  const [mode, setMode] = useState<DistributionMode>("abonnement");
  const [rawContentByRightholder, setRawContentByRightholder] = useState<RightsHolderContentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortFilter, setSortFilter] = useState<SortOption>("none");

  const toast = useToast();

  // Fonction de rafraîchissement manuel
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await imageRightsApi.contentsList(contentType, {});
      setRawContentByRightholder(res.filter((g) => getItemsFromGroup(g).length > 0));
    } catch (err) {
      const friendly = formatApiError(err);
      toast.error({ title: "Erreur", description: friendly.message });
    } finally {
      setLoading(false);
    }
  }, [contentType, getItemsFromGroup, toast]);

  // Chargement initial des données
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await imageRightsApi.contentsList(contentType, {
          signal: controller.signal,
        });
        setRawContentByRightholder(
          res.filter((g) => {
            const items = getItemsFromGroup(g);
            return items.length > 0;
          })
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const friendly = formatApiError(err);
        toast.error({ title: "Erreur", description: friendly.message });
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [contentType, getItemsFromGroup, toast]);

  // Calcul des options du filtre statut (recalculé en fonction du mode actif)
  const statusFilterOptions = useMemo<StatusFilterOption[]>(() => {
    const allItems = rawContentByRightholder
      .flatMap((group) => getItemsFromGroup(group))
      .filter((item) => {
        // Mode fallback : si undefined, prend "abonnement" par défaut
        const itemType = item.type ?? "abonnement";
        return itemType === mode;
      });

    const counters: Record<string, number> = { all: 0 };
    allItems.forEach((item) => {
      counters.all++;
      counters[item.status] = (counters[item.status] || 0) + 1;
    });

    const options: StatusFilterOption[] = [
      { value: "all", label: "Tous", count: counters.all },
    ];

    (Object.keys(STATUS_CONFIG) as ContentStatus[]).forEach((status) => {
      const count = counters[status];
      if (count && count > 0) {
        options.push({
          value: status,
          label: STATUS_CONFIG[status].label,
          count,
        });
      }
    });

    return options;
  }, [rawContentByRightholder, getItemsFromGroup, mode]);

  // Données filtrées et triées
  const filteredData = useMemo((): FilteredGroup<T>[] => {
    return rawContentByRightholder
      .map((group) => {
        const items = getItemsFromGroup(group);
        const filteredItems = items.filter((item) => {
          // Mode fallback : si undefined, prend "abonnement" par défaut
          const itemType = item.type ?? "abonnement";

          const typeMatch = itemType === mode;
          const statusMatch = statusFilter === "all" || item.status === statusFilter;
          return typeMatch && statusMatch;
        });

        return {
          id: group.id,
          firstName: group.firstName,
          lastName: group.lastName,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0)
      .map((group) => {
        const sortedItems = [...group.items];

        if (sortFilter === "best") {
          sortedItems.sort((a, b) => getRevenue(b) - getRevenue(a));
        }

        if (sortFilter === "latest") {
          sortedItems.sort((a, b) => {
            const dateA = getCreatedAt(a) ? new Date(getCreatedAt(a)!).getTime() : 0;
            const dateB = getCreatedAt(b) ? new Date(getCreatedAt(b)!).getTime() : 0;
            return dateB - dateA;
          });
        }

        return { ...group, items: sortedItems };
      });
  }, [
    rawContentByRightholder,
    mode,
    statusFilter,
    sortFilter,
    getItemsFromGroup,
    getRevenue,
    getCreatedAt,
  ]);

  return {
    // États
    mode,
    setMode,
    loading,
    statusFilter,
    setStatusFilter,
    sortFilter,
    setSortFilter,
    refreshData,
    // Données
    filteredData,
    // Pour le filtre statut
    statusFilterOptions,
  };
}