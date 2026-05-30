"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Film, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { EpisodeDetail } from "@/types/api/episode";
import VideoPlayer from "@/ui/components/videoPlayer";
import { usePlayback } from "@/lib/hooks/usePlayback";
import ConfirmationDialog, { type DialogStatus } from "@/ui/components/confirmationDialog";
import { episodeApi } from "@/lib/api/episode";

interface EpisodeCardProps {
  episode: EpisodeDetail;
  seriesId: string;
  onDeleted?: () => void;
}

export default function EpisodeCard({ episode, seriesId, onDeleted }: EpisodeCardProps) {
  const router = useRouter();
  const posterSrc = episode.posterUrl ?? null;

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const { mediaList, loading: playbackLoading, error: playbackError, load: loadPlayback, reset: resetPlayback } = usePlayback();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<DialogStatus>("idle");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const handleOpenPlayer = () => {
    setIsPlayerOpen(true);
    void loadPlayback(episode.id, "episode", "MAIN");
  };

  const handleClosePlayer = useCallback(() => {
    setIsPlayerOpen(false);
    resetPlayback();
  }, [resetPlayback]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPlayerOpen) handleClosePlayer();
    };
    if (isPlayerOpen) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isPlayerOpen, handleClosePlayer]);

  const handleEdit = () => {
    router.push(`/series/detail/${seriesId}/episodes/add?season=${episode.seasonId}&episodeId=${episode.id}`);
  };

  const handleDelete = async () => {
    setDeleteStatus("loading");
    try {
      await episodeApi.delete(episode.id);
      setDeleteStatus("success");
      setDeleteMessage("Épisode supprimé avec succès.");
      setTimeout(() => {
        setDeleteOpen(false);
        setDeleteStatus("idle");
        onDeleted?.();
      }, 1000);
    } catch {
      setDeleteStatus("error");
      setDeleteMessage("Erreur lors de la suppression.");
    }
  };

  return (
    <>
      <div className="bg-[#1e1e1e] text-white p-4 rounded-xl shadow-lg flex flex-col gap-1 max-w-5xl mx-2 mb-4 relative">
        <div className="flex flex-col items-center">
          {posterSrc ? (
            <Image
              width={96}
              height={96}
              src={posterSrc}
              alt={episode.title}
              className="w-24 h-24 object-cover rounded-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
              <Film size={32} className="text-white/30" />
            </div>
          )}
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
          <button
            className="btn btn-sm btn-outline btn-success p-1 flex items-center gap-1"
            onClick={handleOpenPlayer}
          >
            <Play size={12} /> Voir
          </button>
          <button
            className="btn btn-sm btn-outline btn-info p-1"
            onClick={handleEdit}
          >
            Modifier
          </button>
          <button
            className="btn btn-sm btn-outline btn-error p-1"
            onClick={() => { setDeleteOpen(true); setDeleteStatus("idle"); setDeleteMessage(null); }}
          >
            Supprimer
          </button>
        </div>
      </div>

      {isPlayerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClosePlayer}
        >
          <div
            className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClosePlayer}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              aria-label="Fermer (Échap)"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="absolute bottom-4 right-4 z-10 text-xs text-white/40 bg-black/50 px-2 py-1 rounded-md">
              Échap ✕
            </div>
            {playbackLoading ? (
              <div className="flex items-center justify-center h-64 bg-black">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : playbackError ? (
              <div className="flex items-center justify-center h-64 bg-black text-red-400 text-sm px-4 text-center">
                {playbackError}
              </div>
            ) : (
              <VideoPlayer src={mediaList[0]?.url ?? null} title={episode.title} autoPlay />
            )}
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={deleteOpen}
        title="Supprimer l'épisode"
        message={`Êtes-vous sûr de vouloir supprimer « ${episode.title} » ? Cette action est irréversible.`}
        status={deleteStatus}
        resultMessage={deleteMessage}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteStatus("idle"); setDeleteMessage(null); }}
      />
    </>
  );
}
