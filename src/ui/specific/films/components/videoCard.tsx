// ui/specific/films/components/videoCard.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Gauge, Play, Star, TrendingUp, X } from "lucide-react";
import Image from "next/image";
import { StatusBadge } from "@/ui/components/statusBadge";
import type { ContentStatus, ContentAction } from "@/types/api/common";
import VideoPlayer from "../../../components/videoPlayer";
import { usePlayback } from "@/lib/hooks/usePlayback";
import type { PlaybackAttachmentType } from "@/types/api/playback";

export type NormalizedStats = {
  locationsCount?: number;
  revenue: number;
  donutViewed: number;
  donutCatalog: number;
  donutRevenue: number;
  geo: {
    label?: string;
    value?: number;
    max?: number;
    color?: string;
  }[];
};

const ATTACHMENT_LABELS: Record<string, string> = {
  MAIN: 'Principal',
  TRAILER: 'Bande-annonce',
  BONUS: 'Bonus',
  CLIP: 'Clip',
  ADVERTISEMENT: 'Pub',
};

// Configuration des actions selon le statut
const STATUS_ACTION_CONFIG: Record<
  ContentStatus,
  { action: ContentAction; label: string } | null
> = {
  DRAFT: { action: "publish", label: "Publier" },
  PROCESSING: null,
  PROCESSED: { action: "publish", label: "Publier" },
  PUBLISHED: { action: "archive", label: "Archiver" },
  ARCHIVED: { action: "restore", label: "Restaurer" },
};

type VideoCardProps = {
  title: string;
  poster?: string;
  hero?: string;
  director?: string;
  dp?: string;
  category?: string;
  status: ContentStatus;
  stars?: number;
  stats: NormalizedStats;
  mode: "abonnement" | "location";
  detailHref?: string;
  contentId: string;
  contentType: 'film' | 'serie';
  attachmentType?: PlaybackAttachmentType;
  attachments?: { type: string }[];
  onEdit?: () => void;
  onPlay?: () => void;
  onAction?: (action: ContentAction) => void;
};

export default function VideoCard({
  title,
  poster,
  hero,
  director,
  dp,
  category,
  status,
  stars = 0,
  stats,
  mode,
  detailHref,
  contentId,
  contentType,
  attachmentType = 'MAIN',
  attachments = [],
  onEdit,
  onPlay,
  onAction,
}: VideoCardProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [activeAttachmentType, setActiveAttachmentType] = useState<PlaybackAttachmentType>(attachmentType);
  const { url: playbackUrl, loading: playbackLoading, error: playbackError, load: loadPlayback, reset: resetPlayback } = usePlayback();

  const posterSrc = poster || "/image-icon.jpg";

  const {
    locationsCount,
    revenue,
    donutViewed,
    donutCatalog,
    donutRevenue,
    geo,
  } = stats;

  const actionConfig = STATUS_ACTION_CONFIG[status];

  const handleAction = () => {
    if (actionConfig && onAction) {
      onAction(actionConfig.action);
    }
  };

  const handleOpenPlayer = () => {
    setIsPlayerOpen(true);
    onPlay?.();
    void loadPlayback(contentId, contentType, activeAttachmentType);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setActiveAttachmentType(attachmentType);
    resetPlayback();
  };

  const handleSwitchAttachment = (type: PlaybackAttachmentType) => {
    setActiveAttachmentType(type);
    void loadPlayback(contentId, contentType, type);
  };

  // 🎹 Gestion de la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPlayerOpen) {
        handleClosePlayer();
      }
    };

    if (isPlayerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Empêcher le scroll du body quand la modal est ouverte
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restaurer le scroll quand la modal est fermée
      document.body.style.overflow = "";
    };
  }, [isPlayerOpen]);

  const conicGradient = useMemo(() => {
    const segments = [
      { color: "#16a34a", value: donutViewed },
      { color: "#fb7185", value: donutCatalog },
    ];
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    let cursor = 0;

    return segments
      .map((seg) => {
        const start = (cursor / total) * 100;
        cursor += seg.value;
        const end = (cursor / total) * 100;
        return `${seg.color} ${start}% ${end}%`;
      })
      .join(", ");
  }, [donutCatalog, donutViewed]);

  const geoMaxValue = useMemo(() => {
    if (geo.length === 0) return 100;
    return Math.max(...geo.map(g => g.value || 0));
  }, [geo]);

  return (
    <>
      <div className="bg-neutral text-white p-4 rounded-xl shadow-lg flex flex-col gap-4 border border-base-300">
        <div className="flex items-start gap-4">
          {/* === LEFT === */}
          <div className="flex flex-col items-center gap-2">
            <Image
              width={360}
              height={360}
              src={posterSrc}
              alt="Video Poster"
              className="w-40 h-28 object-cover rounded-md"
            />
            
            <button 
              className="btn btn-success btn-sm w-full rounded-full"
              onClick={onEdit}
            >
              Modifier
            </button>

            {actionConfig && (
              <button
                className="btn btn-primary btn-sm w-full rounded-full"
                onClick={handleAction}
              >
                {actionConfig.label}
              </button>
            )}

            {detailHref && (
              <a
                href={detailHref}
                className="btn btn-ghost btn-xs text-primary border-primary/50 rounded-full w-full text-center"
              >
                Voir les détails
              </a>
            )}
          </div>

          {/* === INFO === */}
          <div className="flex-1 flex flex-col gap-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} size="sm" />
            </div>
            <p className="text-sm">Réalisé par {director}</p>
            <p className="text-sm">DP : {dp}</p>
            <p className="text-sm">Catégorie : {category}</p>
          </div>

          {/* === HERO AVEC PLAYER === */}
          <div className="flex items-start gap-4 flex-[1.2]">
            <div className="relative">
              <Image
                width={360}
                height={360}
                src={hero ?? posterSrc}
                alt="scene"
                className="w-60 h-48 object-cover rounded-md"
              />
              <button 
                className="absolute inset-0 flex items-center justify-center"
                onClick={handleOpenPlayer}
              >
                <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-black" />
                </span>
              </button>
            </div>

            {/* === STATS === */}
            <div className="p-3 rounded-lg flex flex-col gap-2 min-w-[160px]">
              <p className="text-sm text-white/70 font-semibold">Statistique:</p>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-primary font-bold">{locationsCount ?? 0}</h4>
                  <p className="text-xs text-white/60">
                    {mode === "location" ? "Locations" : "Abonnements"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-primary font-bold">
                    {revenue.toLocaleString()} FCFA
                  </h4>
                  <p className="text-xs text-white/60">Revenus</p>
                </div>
              </div>

              <p className="text-sm mt-2">Notes / Avis</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < stars
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-yellow-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* === GEO / DONUT === */}
          {mode === "location" ? (
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">Revenu géographique</h3>

              {geo.length > 0 ? (
                <div className="space-y-2">
                  {geo.map((geoItem, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <p>{geoItem.label || "Pays"}</p>
                        <p>{geoItem.value?.toLocaleString() || 0} FCFA</p>
                      </div>
                      <progress
                        className="progress w-full"
                        value={geoItem.value || 0}
                        max={geoMaxValue}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-white/40 italic text-center py-4">
                  Aucune donnée géographique disponible
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-4">
              <div className="relative w-44 h-44">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${conicGradient})`,
                  }}
                />
                <div className="absolute inset-3 rounded-full bg-base-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {donutViewed}%
                    </div>
                    <div className="text-xs text-white/60">min suivi</div>
                  </div>
                </div>
              </div>

              <div className="text-sm space-y-2">
                <p>Temps total du catalogue</p>
                <p className="text-white/60">{donutCatalog.toLocaleString()} minutes</p>

                <p>Revenu généré</p>
                <p className="text-white/60">{donutRevenue.toLocaleString()} FCFA</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL VIDEO PLAYER */}
      {isPlayerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleClosePlayer}
        >
          <div 
            className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermeture */}
            <button
              onClick={handleClosePlayer}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Fermer (Échap)"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Indicateur touche Échap (optionnel) */}
            <div className="absolute bottom-4 right-4 z-10 text-xs text-white/40 bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
              Échap ✕
            </div>

            {/* Sélecteur d'attachment */}
            {attachments.length > 1 && (
              <div className="flex gap-2 px-4 py-3 bg-black border-b border-white/10">
                {attachments.map(({ type }) => (
                  <button
                    key={type}
                    onClick={() => handleSwitchAttachment(type as PlaybackAttachmentType)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      activeAttachmentType === type
                        ? 'bg-primary text-black font-medium'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {ATTACHMENT_LABELS[type] ?? type}
                  </button>
                ))}
              </div>
            )}

            {/* Video Player */}
            {playbackLoading ? (
              <div className="flex items-center justify-center h-64 bg-black">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : playbackError ? (
              <div className="flex items-center justify-center h-64 bg-black text-red-400 text-sm px-4 text-center">
                {playbackError}
              </div>
            ) : (
              <VideoPlayer src={playbackUrl} title={title} autoPlay={true} />
            )}
          </div>
        </div>
      )}
    </>
  );
}