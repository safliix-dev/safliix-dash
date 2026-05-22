// app/series/detail/[id]/client.tsx
'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/ui/components/statusBadge";
import { useSeriesDetail } from "../useSeriesDetail";
import { SeasonRow } from "./SeasonRow";

export default function SeriesDetailPage() {
  const params = useParams();
  const seriesId = params.id as string;

  const { detail, loading, seasons } = useSeriesDetail(seriesId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-dots loading-lg" />
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

      {seasons.map(season => (
        <SeasonRow key={season.id} season={season} seriesId={seriesId} />
      ))}
    </div>
  );
}
