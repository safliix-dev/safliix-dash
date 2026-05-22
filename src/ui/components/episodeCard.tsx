"use client";

import Link from "next/link";
import Image from "next/image";
import type { EpisodeDetail } from "@/types/api/episode";

export default function EpisodeCard({ episode }: { episode: EpisodeDetail }) {
  const poster = episode.attachment?.find(a => a.type === "POSTER");

  return (
    <div className="bg-[#1e1e1e] text-white p-4 rounded-xl shadow-lg flex flex-col gap-1 max-w-5xl mx-2 mb-4 relative">
      <Link
        className="absolute top-2 right-2 flex px-2 py-1 items-center gap-2 bg-primary rounded-md cursor-pointer"
        href={`/series/episodes/${episode.id}`}
      >
        <span className="text-sm">Voir</span>
      </Link>
      <div className="flex flex-col items-center">
        <Image
          width={96}
          height={96}
          src={poster ? `/api/proxy/media/file/${poster.mediaFile.id}` : "/image-icon.jpg"}
          alt={episode.title}
          className="w-24 h-24 object-cover rounded-md"
        />
      </div>
      <div className="flex flex-col justify-between mb-10">
        <h4 className="font-semibold">
          {episode.number !== undefined ? `Épisode ${episode.number}` : "Épisode"}
        </h4>
        <h3 className="text-sm">{episode.title}</h3>
        <p className="text-sm text-neutral-400">
          {episode.duration ? `Durée : ${episode.duration} min` : "Durée non renseignée"}
        </p>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
        <button className="btn btn-sm btn-outline btn-info p-1">Modifier</button>
        <button className="btn btn-sm btn-outline btn-error p-1">Supprimer</button>
      </div>
    </div>
  );
}
