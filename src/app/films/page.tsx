'use client';

import FilterBtn from "@/ui/components/filterBtn";
import Header from "@/ui/components/header";
import VideoCard from "@/ui/specific/films/components/videoCard";
import ClientPDFDownload from "@/ui/components/clientPdfDownloader";
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
import { jobApi } from "@/lib/api/job";
import { useJobSocket } from "@/lib/hooks/useVideoSocket"; // 👈 Importer le hook
import type { EncodingJob } from "@/types/api/job";
import { NormalizedStats } from "@/ui/specific/films/components/videoCard";

type DistributionMode = "location" | "abonnement";
type SortOption = "none" | "best" | "latest";

export default function Page() {
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<DistributionMode>("location");
  const [rawFilmsByRightsholder, setRawFilmsByRightsholder] = useState<RightsHolderContentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState<SortOption>("none");
  const [reportPeriod, setReportPeriod] = useState({ start: "", end: "" });

  const [showEncoding, setShowEncoding] = useState(true); 
  const [encodingJobs, setEncodingJobs] = useState<EncodingJob[]>([]);

  const accessToken = useAccessToken();
  const toast = useToast();

  // ✅ Intégration du hook WebSocket pour les jobs
  const { isConnected: socketConnected } = useJobSocket("movies", (data) => {
    console.log("📡 Mise à jour socket reçue:", data);
    
    // Mettre à jour le job correspondant
    if (data.jobId) {
      setEncodingJobs(prev => prev.map(job => {
        if (job.id === data.jobId) {
          return {
            ...job,
            progress: data.progress || job.progress,
            status: mapSocketStatusToJobStatus(data.status),
            message: data.message,
          };
        }
        return job;
      }));
    }
  });

  // Helper pour mapper le statut socket vers le statut du job
  const mapSocketStatusToJobStatus = (status: string): "processing" | "paused" | "failed" | "completed" => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'processing':
        return 'processing';
      case 'paused':
        return 'paused';
      case 'failed':
        return 'failed';
      case 'completed':
        return 'completed';
      default:
        return 'processing';
    }
  };

  const updateJob = (id: string, updates: Partial<EncodingJob>) => { 
    setEncodingJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...updates } : job))); 
  };

  const handlePause = (id: string) => updateJob(id, { status: "paused" }); 
  const handleResume = (id: string) => updateJob(id, { status: "processing" }); 
  const handleFail = (id: string) => updateJob(id, { status: "failed" });

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

  // ✅ Chargement initial des jobs
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await jobApi.list({type:"MOVIE"}, accessToken);
        if (Array.isArray(res)) {
          setEncodingJobs(res);
          console.dir(res, {depth:2});
        }  
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

  // ✅ Chargement des films par ayant-droit
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await imageRightsApi.contentsList("movie", { 
          accessToken, 
          signal: controller.signal 
        });
        console.dir(res, {depth:2});
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
          const typeMatch = mode === f.type.toLowerCase();
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
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${socketConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
            <span>{socketConnected ? 'Temps réel actif' : 'Connexion socket...'}</span>
          </div>
          <Link className="btn btn-primary btn-sm rounded-lg" href="/films/add">
            <Plus className="w-4 h-4 mr-1" /> Ajouter un film
          </Link>
        </div>
      </Header>

      {/* ✅ Section des jobs d'encodage */}
      {encodingJobs.length > 0 && ( 
        <div className="bg-neutral rounded-2xl border border-base-300 p-4 shadow-sm"> 
          <div className="flex items-center justify-between gap-3"> 
            <div> 
              <p className="text-xs uppercase text-white/50">Encodage</p> 
              <div className="flex items-center gap-2"> 
                <h3 className="text-lg font-semibold text-white">Tâches</h3> 
                <span className="badge badge-sm badge-outline border-primary/40 text-primary">
                  {encodingJobs.filter(j => j.status === 'processing').length} en cours
                </span>
                {socketConnected && (
                  <span className="badge badge-xs badge-success">Live</span>
                )}
              </div> 
            </div> 
            <div className="flex items-center gap-3 text-xs text-white/60"> 
              <span>Source: {socketConnected ? 'socket.io (temps réel)' : 'API'}</span> 
              <label className="flex items-center gap-2 cursor-pointer text-white/70"> 
                <span>{showEncoding ? "Masquer" : "Afficher"}</span> 
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={showEncoding} onChange={() => setShowEncoding((prev) => !prev)} /> 
              </label> 
            </div> 
          </div> 
          {showEncoding && ( 
            <div className="mt-3 space-y-3"> 
              {encodingJobs.map((job) => ( 
                <div key={job.id} className="rounded-xl border border-base-300/60 bg-base-200/40 p-3 space-y-2"> 
                  <div className="flex items-center justify-between"> 
                    <div> 
                      <p className="text-sm text-white/70">{job.title}</p> 
                      <p className="text-sm font-semibold text-white">
                        {job.status === "processing" ? "Encodage en cours" : 
                         job.status === "completed" ? "Encodage terminé" :
                         job.status === "failed" ? "Échec d'encodage" : "En pause"}
                      </p>
                    </div> 
                    <span className="text-xs text-white/50">{job.startedAt}</span> 
                  </div> 
                  <div className="flex items-center gap-3"> 
                    <div className="flex-1"> 
                      <div className="flex items-center justify-between text-xs text-white/60 mb-1"> 
                        <span>Progression</span> 
                        <span>{job.progress}%</span> 
                      </div> 
                      <progress 
                        className={`progress w-full ${job.status === 'failed' ? 'progress-error' : 'progress-primary'}`} 
                        value={job.progress} 
                        max="100"
                      ></progress> 
                    </div> 
                    <div className="flex items-center gap-2"> 
                      {job.status !== "completed" && (
                        <>
                          <button 
                            className="btn btn-xs btn-ghost text-white/80" 
                            onClick={() => handleFail(job.id)} 
                          > 
                            Marquer échoué 
                          </button> 
                          {job.status === "processing" ? ( 
                            <button 
                              className="btn btn-xs btn-error text-white" 
                              onClick={() => handlePause(job.id)} 
                            > 
                              Stopper 
                            </button>
                          ) : job.status === "paused" ? (
                            <button 
                              className="btn btn-xs btn-primary" 
                              onClick={() => handleResume(job.id)} 
                            > 
                              Relancer 
                            </button>
                          ) : null}
                        </>
                      )}
                    </div> 
                  </div> 
                </div> 
              ))} 
            </div>
          )} 
        </div>
      )}

      {/* Reste du code inchangé pour les filtres et l'affichage des films */}
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
                        detailHref={`/dashboard/films/detail/${film.id}`} 
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