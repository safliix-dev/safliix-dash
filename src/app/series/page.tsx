// app/series/page.tsx
'use client';

import Header from "@/ui/components/header";
import VideoCard from "@/ui/specific/films/components/videoCard";
import FilterBtn from "@/ui/components/filterBtn";
import { EncodingJobsMonitor } from "@/ui/components/EncodingJobsMonitor";
import { Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { imageRightsApi } from "@/lib/api/imageRights";
import { RightsHolderContentResponse } from "@/types/api/imageRights";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RightsHolderMoviesReport, type MovieReportEntry } from "@/ui/pdf/RightsHolderMoviesReport";
import { SeriesListItem } from "@/types/api/series";
import { NormalizedStats } from "@/ui/specific/films/components/videoCard";
import { SocketIndicator } from "@/lib/hooks/useSocketStatus";

export default function SeriesPage() {
  const mode: "location" | "abonnement" = "abonnement";
  
  const dedupeOptions = (values: Array<string | number>) => {
    const seen = new Set<string>();
    return values.filter((val) => {
      const key = String(val).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  
  const reportPeriod = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR");
    return { start: fmt(start), end: fmt(end) };
  })();

  const accessToken = useAccessToken();
  const [rawSeriesByRightsholder, setRawSeriesByRightsholder] = useState<RightsHolderContentResponse[]>([]);
  const [seriesByRightsholder, setSeriesByRightsholder] = useState<RightsHolderContentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortFilter, setSortFilter] = useState<"none" | "best" | "latest">("none");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const toast = useToast();
  
  

  const extractSerieStats = (serie: SeriesListItem): NormalizedStats => {
    const stats = serie.stats;
    
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

    return {
      locationsCount: 0,
      revenue: stats.revenue || 0,
      donutViewed: stats.subscriberViewPercentage || 0,
      donutCatalog: stats.catalogTotalMinutes || 0,
      donutRevenue: stats.revenue || 0,
      geo: [],
    };
  };

  const buildReportEntries = (items: SeriesListItem[]): MovieReportEntry[] =>
    items.map((serie, idx) => ({
      order: `${idx + 1}`.padStart(3, "0"),
      title: serie.title || "Sans titre",
      share: serie.stats?.subscriberViewPercentage || 0,
      views: serie.stats?.totalViews || 0,
      revenue: serie.stats?.revenue || 0
    }));

  const getDate = (serie: SeriesListItem) =>
    new Date(serie.createdAt || 0).getTime();

  // Chargement des séries par ayant-droit
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await imageRightsApi.contentsList("serie", { 
          accessToken, 
          signal: controller.signal 
        });
        if (cancelled) return;
        setRawSeriesByRightsholder(res);
        setLastRefresh(new Date());
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Séries", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accessToken, toast]);

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const applyFilters = useMemo(
    () => (groups: RightsHolderContentResponse[]) =>
      groups
        .map((group) => {
          let items = [...(group.series || [])];
          
          if (statusFilter !== "all") {
            items = items.filter(
              (s) => (s.status || "").toLowerCase() === statusFilter.toLowerCase()
            );
          }
          
          if (categoryFilter !== "all") {
            items = items.filter(
              (s) => (s.category || "").toLowerCase() === categoryFilter.toLowerCase()
            );
          }
          
          if (sortFilter === "best") {
            items = [...items].sort((a, b) => (b.stats?.revenue || 0) - (a.stats?.revenue || 0));
          } else if (sortFilter === "latest") {
            items = [...items].sort((a, b) => getDate(b) - getDate(a));
          }
          
          return { ...group, series: items };
        })
        .filter((group) => Array.isArray(group.series) && group.series.length > 0),
    [categoryFilter, sortFilter, statusFilter],
  );

  useEffect(() => {
    setSeriesByRightsholder(applyFilters(rawSeriesByRightsholder));
  }, [applyFilters, rawSeriesByRightsholder]);

  const allSeriesFlat = useMemo(
    () => rawSeriesByRightsholder.flatMap((g) => g.series || []),
    [rawSeriesByRightsholder],
  );

  const statusOptions = useMemo(() => {
    const statuses = allSeriesFlat
      .map((s) => s?.status)
      .filter(Boolean)
      .map(s => String(s));
    return ["all", ...Array.from(new Set(statuses))];
  }, [allSeriesFlat]);

  const categoryOptions = useMemo(() => {
    const categories = allSeriesFlat
      .map((s) => s?.category)
      .filter(Boolean)
      .map(c => String(c));
    return dedupeOptions(["all", ...categories]);
  }, [allSeriesFlat]);

  const formattedDate = lastRefresh.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="space-y-5">
      <Header title="Nos séries" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span>Dernière actualisation</span>
            <div className="bg-base-200 px-3 py-2 rounded-lg border border-base-300">
              <span>{formattedDate}</span>
            </div>
          </div>
          
          {/* ✅ Indicateur de connexion socket */}
          <SocketIndicator/>
          
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm rounded-lg">
              <Download className="w-4 h-4" />
              <span className="ml-1">Exporter les rapports</span>
            </button>
            <Link className="btn btn-primary btn-sm rounded-lg" href={"/series/add"}>
              Ajouter une série
            </Link>
          </div>
        </div>
      </Header>

      {/* ✅ Monitoring des jobs d'encodage */}
      <EncodingJobsMonitor 
        room="episodes"
        jobType="EPISODE"
        title="Encodage des épisodes"
        onJobClick={(job) => {
          console.log("Job cliqué:", job);
          // Tu peux ajouter une navigation vers le détail du job ici
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterBtn
            title="Filtrer par statut"
            selected={statusFilter}
            options={statusOptions.map((s) => ({ 
              label: s === "all" ? "Tous les statuts" : String(s), 
              value: String(s) 
            }))}
            onSelect={(v) => setStatusFilter(v)}
          />
          <FilterBtn
            title="Catégorie de série"
            selected={categoryFilter}
            options={categoryOptions.map((c) => ({
              label: c === "all" ? "Toutes les catégories" : String(c),
              value: String(c),
            }))}
            onSelect={(v) => setCategoryFilter(v)}
          />
          <FilterBtn
            title="Tri"
            selected={sortFilter}
            options={[
              { label: "Par défaut", value: "none" },
              { label: "Meilleures ventes", value: "best" },
              { label: "Dernier ajout", value: "latest" },
            ]}
            onSelect={(v) => setSortFilter(v as typeof sortFilter)}
          />
        </div>
      </div>

      {loading && (
        <div className="alert alert-info text-sm">
          <span className="loading loading-spinner loading-sm"></span>
          Chargement des séries...
        </div>
      )}
      
      {error && (
        <div className="alert alert-error text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {seriesByRightsholder.map((group) => (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="badge badge-primary badge-outline">{`${group.firstName} ${group.lastName}`}</div>
                <span className="text-sm text-white/60">
                  ({group.series.length} série{group.series.length > 1 ? "s" : ""})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost btn-xs text-white border-base-300 rounded-full"
                  onClick={() => toggleGroup(group.id)}
                >
                  {collapsedGroups.has(group.id) ? "Déplier" : "Plier"}
                </button>
                <PDFDownloadLink
                  document={
                    <RightsHolderMoviesReport
                      mode={mode}
                      rightsholderName={`${group.firstName} ${group.lastName}`}
                      periodStart={reportPeriod.start}
                      periodEnd={reportPeriod.end}
                      entries={buildReportEntries(group.series)}
                    />
                  }
                  fileName={`rapport-${group.lastName || "ayant-droit"}-${mode}.pdf`}
                  className="btn btn-ghost btn-xs text-primary border-primary/50 rounded-full"
                >
                  {({ loading }) => (
                    <span className="flex items-center gap-1">
                      {loading && <span className="loading loading-spinner loading-xs text-primary" />}
                      {loading ? "Préparation..." : "Télécharger le rapport"}
                    </span>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
            
            {!collapsedGroups.has(group.id) ? (
              <div className="space-y-4">
                {group.series.map((serie) => {
                  const stats = extractSerieStats(serie);
                  return (
                    <VideoCard
                      key={serie.id}
                      title={serie.title}
                      poster={serie.poster}
                      hero={serie.hero}
                      director={serie.director}
                      dp={serie.dp}
                      category={serie.category}
                      status={serie.status}
                      stats={stats}
                      mode={mode}
                      detailHref={`/series/detail/${serie.id}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-white/60 italic">Liste repliée</div>
            )}
          </div>
        ))}
        
        {!loading && !error && seriesByRightsholder.length === 0 && (
          <div className="text-sm text-white/70 text-center py-10">
            Aucune série à afficher.
          </div>
        )}
      </div>
      
      {seriesByRightsholder.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-white/70 justify-center pt-4">
          <button className="btn btn-ghost btn-xs">◀</button>
          <button className="btn btn-primary btn-xs">1</button>
          <button className="btn btn-ghost btn-xs">2</button>
          <button className="btn btn-ghost btn-xs">▶</button>
        </div>
      )}
    </div>
  );
}