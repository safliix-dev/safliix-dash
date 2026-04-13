// app/films/page.tsx
'use client';

import FilterBtn from "@/ui/components/filterBtn";
import Header from "@/ui/components/header";
import VideoCard from "@/ui/specific/films/components/videoCard";
import ClientPDFDownload from "@/ui/components/clientPdfDownloader";
import { EncodingJobsMonitor } from "@/ui/components/EncodingJobsMonitor";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { imageRightsApi } from "@/lib/api/imageRights";
import { RightsHolderMoviesReport, type MovieReportEntry } from "@/ui/pdf/RightsHolderMoviesReport";
import type { RightsHolderContentResponse } from "@/types/api/imageRights";
import type { FilmListItem } from "@/types/api/films";
import { NormalizedStats } from "@/ui/specific/films/components/videoCard";
import { SocketIndicator } from "@/lib/hooks/useSocketStatus";

type DistributionMode = "location" | "abonnement";
type SortOption = "none" | "best" | "latest";

export default function FilmsPage() {
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<DistributionMode>("location");
  const [rawFilmsByRightsholder, setRawFilmsByRightsholder] = useState<RightsHolderContentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState<SortOption>("none");
  const [reportPeriod, setReportPeriod] = useState({ start: "", end: "" });

  const accessToken = useAccessToken();
  const toast = useToast();
  
  // ✅ Hook pour le statut de connexion socket
  

  const extractFilmStats = (film: FilmListItem): NormalizedStats => {
    const stats = film.stats;

    if (!stats) {
      return {
        locationsCount: 0,
        revenue: 0,
        donutViewed: 0,
        donutCatalog: 0,
        donutRevenue: 0,
        geo: [],
      };
    }

    if (stats.type === "abonnement") {
      const s = stats.stats;
      return {
        locationsCount: 0,
        revenue: s.revenue,
        donutViewed: s.subscriberViewPercentage,
        donutCatalog: s.catalogTotalMinutes,
        donutRevenue: s.revenue,
        geo: [],
      };
    }

    if (stats.type === "location") {
      const s = stats.stats;
      return {
        locationsCount: s.totalRentals,
        revenue: s.revenue,
        donutViewed: s.totalRentals,
        donutCatalog: 0,
        donutRevenue: s.revenue,
        geo: s.topCountries,
      };
    }

    return {
      locationsCount: 0,
      revenue: 0,
      donutViewed: 0,
      donutCatalog: 0,
      donutRevenue: 0,
      geo: [],
    };
  };

  useEffect(() => {
    setIsClient(true);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR");
    setReportPeriod({ start: fmt(start), end: fmt(end) });
  }, []);

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const getRevenue = (film: FilmListItem): number => {
    if (!film.stats) return 0;
    switch (film.stats.type) {
      case "abonnement":
      case "location":
        return film.stats.stats.revenue;
      default:
        return 0;
    }
  };

  const getViews = (film: FilmListItem): number => {
    if (!film.stats) return 0;
    if (film.stats.type === "abonnement") {
      return film.stats.stats.totalViews;
    }
    return 0;
  };

  const buildReportEntries = (items: FilmListItem[]): MovieReportEntry[] =>
    items.map((film, idx) => ({
      order: `${idx + 1}`.padStart(3, "0"),
      title: film.title ?? "Sans titre",
      share: getRevenue(film),
      views: getViews(film),
      revenue: getRevenue(film),
    }));

  // Chargement des films par ayant-droit
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await imageRightsApi.contentsList("movie", { 
          accessToken, 
          signal: controller.signal 
        });
        setRawFilmsByRightsholder(res.filter((g) => Array.isArray(g.movies) && g.movies.length > 0));
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const friendly = formatApiError(err);
        toast.error({ title: "Erreur", description: friendly.message });
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [accessToken, toast]);

  const filteredData = useMemo(() => {
    return rawFilmsByRightsholder
      .map(group => ({
        ...group,
        movies: [...group.movies].filter(f => {
          const typeMatch = mode === f.type?.toLowerCase();
          const statusMatch = statusFilter === "all" || f.status?.toLowerCase() === statusFilter.toLowerCase();
          return typeMatch && statusMatch;
        })
      }))
      .filter(g => g.movies.length > 0)
      .map(group => {
        if (sortFilter === "best") group.movies.sort((a, b) => getRevenue(b) - getRevenue(a));
        if (sortFilter === "latest") group.movies.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        return group;
      });
  }, [rawFilmsByRightsholder, mode, statusFilter, sortFilter]);

  return (
    <div className="space-y-5">
      <Header title="Nos films" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span>Dernière actualisation</span>
            <div className="bg-base-200 px-3 py-2 rounded-lg border border-base-300">
              <span>{isClient ? new Date().toLocaleString("fr-FR") : "--/--/---- --:--"}</span>
            </div>
          </div>
          
          {/* ✅ Indicateur de connexion socket */}
          <SocketIndicator />
          
          <Link className="btn btn-primary btn-sm rounded-lg" href="/films/add">
            <Plus className="w-4 h-4 mr-1" /> Ajouter un film
          </Link>
        </div>
      </Header>

      {/* ✅ Monitoring des jobs d'encodage */}
      <EncodingJobsMonitor 
        room="movies"
        jobType="MOVIE"
        title="Encodage des films"
      />

      {/* Filtres */}
      <div className="flex flex-col gap-3">
        <div className="tabs tabs-boxed bg-base-200/40 border border-base-300 rounded-xl w-fit">
          {(["location", "abonnement"] as const).map((m) => (
            <button
              key={m}
              className={`tab px-4 ${mode === m ? "tab-active text-primary font-semibold" : "text-white/60"}`}
              onClick={() => setMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <FilterBtn 
            title="Statut" 
            selected={statusFilter} 
            onSelect={setStatusFilter} 
            options={[{label: "Tous", value: "all"}]} 
          />
          <FilterBtn 
            title="Tri" 
            selected={sortFilter} 
            onSelect={(val) => setSortFilter(val as SortOption)} 
            options={[
              {label: "Par défaut", value: "none"}, 
              {label: "Meilleures ventes", value: "best"},
              {label: "Dernier ajout", value: "latest"}
            ]} 
          />
        </div>
      </div>

      {/* Liste des films */}
      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-dots loading-md"></span>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((group) => (
            <div key={group.id} className="bg-base-200/20 p-4 rounded-2xl border border-base-300/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold">{group.firstName} {group.lastName}</h3>
                  <span className="badge badge-sm badge-ghost">{group.movies.length} films</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleGroup(group.id)} className="btn btn-ghost btn-xs">
                    {collapsedGroups.has(group.id) ? "Déplier" : "Plier"}
                  </button>
                  
                  <ClientPDFDownload
                    label="Rapport PDF"
                    className="btn btn-outline btn-primary btn-xs rounded-full"
                    fileName={`rapport-${group.lastName}-${mode}.pdf`}
                    document={
                      <RightsHolderMoviesReport
                        mode={mode}
                        rightsholderName={`${group.firstName} ${group.lastName}`}
                        periodStart={reportPeriod.start}
                        periodEnd={reportPeriod.end}
                        entries={buildReportEntries(group.movies)}
                      />
                    }
                  />
                </div>
              </div>

              {!collapsedGroups.has(group.id) && (
                <div className="grid gap-3">
                  {group.movies.map((film) => {
                    const stats = extractFilmStats(film);
                    return (
                      <VideoCard 
                        key={film.id} 
                        title={film.title}
                        director={film.director}
                        poster=""
                        dp=""
                        hero=""
                        category=""
                        stats={stats}
                        status=""
                        mode={mode} 
                        detailHref={`/films/detail/${film.id}`} 
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="text-center py-10 text-white/40">Aucun film trouvé.</div>
          )}
        </div>
      )}
    </div>
  );
}