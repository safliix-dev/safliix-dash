import Header from "@/ui/components/header";
import Link from "next/link";
import SeriesEpisodeAddClient from "./client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { season } = await searchParams;
  const seasonId = season ?? "";

  return (
    <div className="space-y-4">
      <Header title="Ajouter un épisode">
        <div className="flex gap-2">
          <Link href={`/dashboard/series/detail/${id}`} className="btn btn-ghost btn-sm">
            Retour
          </Link>
          <button className="btn btn-primary btn-sm" form="episode-form" type="submit">
            Publier épisode
          </button>
        </div>
      </Header>

      <SeriesEpisodeAddClient seriesId={id} seasonId={seasonId} />
    </div>
  );
}
