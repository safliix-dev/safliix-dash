// app/series/page.tsx
'use client';

import Header from "@/ui/components/header";
import VideoCard from "@/ui/specific/films/components/videoCard";
import FilterBtn from "@/ui/components/filterBtn";
import { StatusFilter } from "@/ui/components/statusFilter";
import { StatusBadge } from "@/ui/components/statusBadge";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSeriesManagement } from "./useSeriesManagement";
import { useContentAction } from "@/lib/hooks/useContentAction";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RightsHolderMoviesReport, type MovieReportEntry } from "@/ui/pdf/RightsHolderMoviesReport";
import type { SeriesListItem } from "@/types/api/series";
import type { NormalizedStats } from "@/ui/specific/films/components/videoCard";

export default function SeriesPage() {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const {
    mode,
    loading,
    statusFilter,
    setStatusFilter,
    sortFilter,
    setSortFilter,
    filteredData,
    statusFilterOptions,
    refreshData,
  } = useSeriesManagement();

  // Gestion des actions contextuelles
  const {
    dialogState,
    openConfirmation,
    closeDialog,
    executeAction,
  } = useContentAction({
    contentType: "serie",
    onSuccess: () => {
      refreshData?.();
    },
  });

  const reportPeriod = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR");
    return { start: fmt(start), end: fmt(end) };
  })();

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

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSerieAction = (serieId: string, action: "publish" | "archive" | "restore") => {
    openConfirmation(serieId, action);
  };

  return (
    <div className="space-y-5">
      <Header title="Nos séries" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span>Dernière actualisation</span>
            <div className="bg-base-200 px-3 py-2 rounded-lg border border-base-300">
              <span>{new Date().toLocaleString("fr-FR")}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm rounded-lg">
              <Download className="w-4 h-4" />
              <span className="ml-1">Exporter les rapports</span>
            </button>
            <Link className="btn btn-primary btn-sm rounded-lg" href="/series/add">
              <Plus className="w-4 h-4 mr-1" /> Ajouter une série
            </Link>
          </div>
        </div>
      </Header>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-base-200 border border-base-300 rounded-2xl px-4 py-2.5">
        <StatusFilter
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          options={statusFilterOptions}
        />
        <FilterBtn
          title="Tri"
          selected={sortFilter}
          options={[
            { label: "Par défaut", value: "none" },
            { label: "Meilleures ventes", value: "best" },
            { label: "Dernier ajout", value: "latest" },
          ]}
          onSelect={(val) => setSortFilter(val as typeof sortFilter)}
        />
      </div>

      {loading && (
        <div className="alert alert-info text-sm">
          <span className="loading loading-spinner loading-sm"></span>
          Chargement des séries...
        </div>
      )}

      <div className="space-y-6">
        {filteredData.map((group) => (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="badge badge-primary badge-outline">{`${group.firstName} ${group.lastName}`}</div>
                <span className="text-sm text-white/60">
                  ({group.items.length} série{group.items.length > 1 ? "s" : ""})
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
                      entries={buildReportEntries(group.items)}
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
                {group.items.map((serie) => {
                  const stats = extractSerieStats(serie);
                  return (
                    <div key={serie.id} className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        <StatusBadge status={serie.status} />
                      </div>
                      <VideoCard
                        title={serie.title}
                        poster={serie.posterUrl}
                        contentId={serie.id}
                        contentType="serie"
                        attachments={serie.attachments}
                        director={serie.director}
                        dp={serie.dp}
                        category={serie.category}
                        status={serie.status}
                        stats={stats}
                        mode={mode}
                        detailHref={`/series/detail/${serie.id}`}
                        onAction={(action) => handleSerieAction(serie.id, action)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-white/60 italic">Liste repliée</div>
            )}
          </div>
        ))}
        
        {!loading && filteredData.length === 0 && (
          <div className="text-sm text-white/70 text-center py-10">
            Aucune série à afficher.
          </div>
        )}
      </div>
      
      {filteredData.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-white/70 justify-center pt-4">
          <button className="btn btn-ghost btn-xs">◀</button>
          <button className="btn btn-primary btn-xs">1</button>
          <button className="btn btn-ghost btn-xs">2</button>
          <button className="btn btn-ghost btn-xs">▶</button>
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