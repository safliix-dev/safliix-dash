// app/films/page.tsx
'use client';

import Header from "@/ui/components/header";
import VideoCard from "@/ui/specific/films/components/videoCard";
import ClientPDFDownload from "@/ui/components/clientPdfDownloader";
import { StatusFilter } from "@/ui/components/statusFilter";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFilmManagement } from "./useFilmManagement";
import { useContentAction } from "@/lib/hooks/useContentAction";
import { RightsHolderMoviesReport } from "@/ui/pdf/RightsHolderMoviesReport";
import type { NormalizedStats } from "@/ui/specific/films/components/videoCard";
import FilterBtn from "@/ui/components/filterBtn";
import type { FilmListItem } from "@/types/api/films";

export default function FilmsPage() {
  const [isClient, setIsClient] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [reportPeriod, setReportPeriod] = useState({ start: "", end: "" });

  const {
    mode,
    setMode,
    loading,
    statusFilter,
    setStatusFilter,
    sortFilter,
    setSortFilter,
    filteredData,
    statusFilterOptions,
    refreshData,
  } = useFilmManagement();

  // Gestion des actions contextuelles
  const {
    dialogState,
    openConfirmation,
    closeDialog,
    executeAction,
  } = useContentAction({
    contentType: "movie",
    onSuccess: () => {
      // Rafraîchir les données après une action réussie
      refreshData?.();
    },
  });

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

  const handleFilmAction = (filmId: string, action: "publish" | "archive" | "restore") => {
    openConfirmation(filmId, action);
  };

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
          <Link className="btn btn-primary btn-sm rounded-lg" href="/films/add">
            <Plus className="w-4 h-4 mr-1" /> Ajouter un film
          </Link>
        </div>
      </Header>

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
          <StatusFilter 
            selectedStatus={statusFilter}
            onStatusChange={setStatusFilter}
            options={statusFilterOptions}
          />
          
          <FilterBtn 
            title="Tri" 
            selected={sortFilter} 
            onSelect={(val) => setSortFilter(val)} 
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
                  <span className="badge badge-sm badge-ghost">{group.items.length} films</span>
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
                        entries={group.items.map((film, idx) => ({
                          order: `${idx + 1}`.padStart(3, "0"),
                          title: film.title,
                          share: film.stats?.stats?.revenue || 0,
                          views: film.stats?.type === "abonnement" ? film.stats.stats.totalViews : 0,
                          revenue: film.stats?.stats?.revenue || 0,
                        }))}
                      />
                    }
                  />
                </div>
              </div>

              {!collapsedGroups.has(group.id) && (
                <div className="grid gap-3">
                  {group.items.map((film) => {
                    const stats = extractFilmStats(film);
                    return (
                      <VideoCard 
                        key={film.id}
                        title={film.title}
                        director={film.director}
                        poster={film.posterUrl}
                        dp={film.dp}
                        hero={film.movieUrl}
                        category={film.category}
                        stats={stats}
                        status={film.status}
                        mode={mode} 
                        detailHref={`/films/detail/${film.id}`}
                        onAction={(action) => handleFilmAction(film.id, action)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="text-center py-10 text-white/40">
              Aucun film trouvé pour les critères sélectionnés.
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation */}
      <ConfirmationDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        status={dialogState.status}
        resultMessage={dialogState.resultMessage}
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        onConfirm={executeAction}
        onCancel={closeDialog}
      />
    </div>
  );
}