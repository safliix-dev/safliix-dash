// app/series/detail/[id]/page.tsx
'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import EpisodeCard from "@/ui/components/episodeCard";
import { StatusBadge } from "@/ui/components/statusBadge";
import { useSeriesDetail } from "../useSeriesDetail";

export default function SeriesDetailPage() {
  const params = useParams();
  const seriesId = params.id as string;
  
  const {
    detail,
    loading,
    seasons,
    episodesBySeason,
    expandedSeasons,
    toggleSeason,
  } = useSeriesDetail(seriesId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-10 text-white/40">
        Série non trouvée
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête de la série - identique à l'original */}
      <div className="bg-neutral rounded-lg border border-base-300 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{detail.title}</h2>
          <div className="flex items-center gap-2">
            <span className="badge badge-outline border-primary/40 text-primary">
              {detail.category || "—"}
            </span>
            <Link href={`/series/addSeason/${seriesId}`} className="btn btn-primary btn-sm">
              Ajouter une saison
            </Link>
          </div>
        </div>
        <div className="text-sm text-white/70 flex gap-4 flex-wrap">
          <span>Langue: {detail.mainLanguage || "—"}</span>
          <span>Saisons: {seasons.length}</span>
          <span>Statut: <StatusBadge status={detail.status} size="sm" /></span>
        </div>
        {detail.description && (
          <p className="text-sm text-white/80">{detail.description}</p>
        )}
      </div>

      {/* Liste des saisons - identique à l'original */}
      {seasons.map((season) => (
        <div key={season.id} className="space-y-3">
          <div className="shadow-lg bg-neutral rounded-md p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 bg-blue-500 rounded-md" />
              <div className="space-y-1">
                <h1 className="text-white font-bold">SAISON {season.numero}</h1>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-white/70"
                  onClick={() => toggleSeason(season.id)}
                >
                  {expandedSeasons.has(season.id) ? "Réduire" : "Déplier"}
                </button>
              </div>
            </div>
            <Link
              href={`/series/detail/${seriesId}/episodes/add?season=${season.id}`}
              className="btn btn-sm btn-outline btn-primary"
            >
              Ajouter un épisode
            </Link>
          </div>

          {expandedSeasons.has(season.id) && (
            <div className="grid grid-cols-6 gap-2">
              {(episodesBySeason[season.id] ?? []).map((episode) => (
                <EpisodeCard key={episode.id} id={episode.id} />
              ))}
              {!episodesBySeason[season.id]?.length && (
                <div className="col-span-6 text-sm text-white/60">
                  Aucun épisode.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}