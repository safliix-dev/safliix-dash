// app/dashboard/series/[id]/episodes/add/page.tsx

import Link from "next/link";
import { EpisodeFormClient } from "./client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; episodeId?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { id: seriesId } = await params;
  const { season: seasonId, episodeId } = await searchParams;

  if (!seasonId) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Aucune saison sélectionnée. Veuillez choisir une saison.</p>
        <Link href={`/series/detail/${seriesId}`} className="btn btn-primary mt-4">
          Retour à la série
        </Link>
      </div>
    );
  }

  return <EpisodeFormClient seriesId={seriesId} seasonId={seasonId} episodeId={episodeId} />;
}