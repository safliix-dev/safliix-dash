'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import EpisodeCard from "@/ui/components/episodeCard";
import { episodeApi } from "@/lib/api/episode";
import type { SeasonSummary } from "@/types/api/season";
import type { EpisodeDetail } from "@/types/api/episode";

interface SeasonRowProps {
  season: SeasonSummary;
  seriesId: string;
}

export function SeasonRow({ season, seriesId }: SeasonRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [episodes, setEpisodes] = useState<EpisodeDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    episodeApi.list(seriesId, season.id, undefined, )
      .then(data => setEpisodes(data.items ?? []))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [seriesId, season.id]);

  return (
    <div className="space-y-3">
      <div className="shadow-lg bg-neutral rounded-md p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-blue-500 rounded-md" />
          <div className="space-y-1">
            <h1 className="text-white font-bold">SAISON {season.numero}</h1>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-white/70"
              onClick={() => setExpanded(prev => !prev)}
            >
              {expanded ? "Réduire" : "Déplier"}
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

      {expanded && (
        <div className="grid grid-cols-6 gap-2">
          {loading ? (
            <div className="col-span-6 flex justify-center py-4">
              <span className="loading loading-dots loading-sm" />
            </div>
          ) : episodes.length > 0 ? (
            episodes.map(episode => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))
          ) : (
            <div className="col-span-6 text-sm text-white/60">Aucun épisode.</div>
          )}
        </div>
      )}
    </div>
  );
}
