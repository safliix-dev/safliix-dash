import React, { useMemo } from "react";
import { Gauge, Play, Star, TrendingUp } from "lucide-react";
import Image from "next/image";
/* ============================================================
 * Type guards
 * ============================================================ */

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

type VideoCardProps = {
  title: string;
  poster?: string;
  hero?: string;
  director?: string;
  dp?: string;
  category?: string;
  status: string;
  stars?: number;
  stats: NormalizedStats;
  mode: "abonnement" | "location";
  detailHref?: string;
};



/* ============================================================
 * Helpers métier (lecture des stats)
 * ============================================================ */






/* ============================================================
 * Component
 * ============================================================ */

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
}: VideoCardProps) {
  const posterSrc = poster || "/image-icon.jpg";
    //const heroSrc = hero || poster;


  const {
    locationsCount,
    revenue,
    donutViewed,
    donutCatalog,
    donutRevenue,
  } = stats;
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

  return (
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
          <button className="btn btn-success btn-sm w-full rounded-full">
            Modifier
          </button>

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
          <p className="text-green-400 text-sm">{status}</p>
          <p className="text-sm">Réalisé par {director}</p>
          <p className="text-sm">DP : {dp}</p>
          <p className="text-sm">Catégorie : {category}</p>
        </div>

        {/* === HERO === */}
        <div className="flex items-start gap-4 flex-[1.2]">
          <div className="relative">
            <Image
              width={360}
              height={360}
              src={hero ?? posterSrc}
              alt="scene"
              className="w-60 h-48 object-cover rounded-md"
            />
            <button className="absolute inset-0 flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
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
                <h4 className="text-primary font-bold">{locationsCount}</h4>
                <p className="text-xs text-white/60">
                  {mode === "location" ? "Location" : "Abonnements"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <div>
                <h4 className="text-primary font-bold">{revenue}</h4>
                <p className="text-xs text-white/60">revenus</p>
              </div>
            </div>

            <p className="text-sm mt-2">Notes / Avis</p>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < (stars ?? 0)
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

            <div className="space-y-2">
              {stats.geo.map((geoItem, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <p>{geoItem.label}</p>
                    <p>{geoItem?.value?.toLocaleString()} f</p>
                  </div>
                  <progress
                    className="progress w-full"
                    value={geoItem.value}
                    max={100}
                  />
                </div>
              ))}
            </div>
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
              <p className="text-white/60">{donutCatalog} minutes</p>

              <p>Revenu généré</p>
              <p className="text-white/60">{donutRevenue}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}