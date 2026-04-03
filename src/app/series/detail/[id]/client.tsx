"use client";

import EpisodeCard from "@/ui/components/episodeCard";
import { useState } from "react";
import { episodeApi } from "@/lib/api/episode";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { formatApiError } from "@/lib/api/errors";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { type SeriesDetail } from "@/types/api/series";
import Link from "next/link";

type Props = {
  id: string;
  seasons: Array<{ id: string; number: string }>;
  detail: SeriesDetail;
};

export default function SeriesDetailClient({ id, seasons, detail }: Props) {
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(() => new Set(seasons.map((s) => s.id)));
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<string, { id: string }[]>>({});
  const toast = useToast();
  const accessToken = useAccessToken();

  const toggleSeason = async (seasonId: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });

    if (episodesBySeason[seasonId]) return;
    try {
      const episodes = await episodeApi.list(id, seasonId, undefined, accessToken);
      const normalized = Array.isArray(episodes) ? episodes : [];
      setEpisodesBySeason((prev) => ({ ...prev, [seasonId]: normalized }));
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Episodes", description: friendly.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral rounded-lg border border-base-300 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{detail.title}</h2>
          <div className="flex items-center gap-2">
            <span className="badge badge-outline border-primary/40 text-primary">{detail.category || "—"}</span>
            <Link href={`/series/addSeason/${id}`} className="btn btn-primary btn-sm">
              Ajouter une saison
            </Link>
          </div>
        </div>
        <div className="text-sm text-white/70 flex gap-4 flex-wrap">
          <span>Langue: {detail.mainLanguage || "—"}</span>
          <span>Saisons: {detail.seasons?.length ?? 0}</span>
          <span>Statut: {detail.status}</span>
        </div>
        {detail.description && <p className="text-sm text-white/80">{detail.description}</p>}
      </div>

      {seasons.map((season) => (
        <div key={season.id} className="space-y-3">
          <div className="shadow-lg bg-neutral rounded-md p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 bg-blue-500 rounded-md" />
              <div className="space-y-1">
                <h1 className="text-white font-bold">SAISON {season.number}</h1>
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
              href={`/series/detail/${id}/episodes/add?season=${season.id}`}
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
                <div className="col-span-6 text-sm text-white/60">Aucun épisode.</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
