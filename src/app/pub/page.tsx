// app/pub/page.tsx
'use client';

import FilterBtn from "@/ui/components/filterBtn";
import Header from "@/ui/components/header";
import { Eye, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { adsApi } from "@/lib/api/ads";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { type AdsItem } from "@/types/api/ads";
import Image from "next/image";

type GeoValue = { label: string; value: number; max: number; color: string };
type Campaign = {
  id: string;
  title: string;
  creative: string;
  status: string;
  startDate?: string;
  endDate?: string;
  number?: string;
  poster?: string;
  views: number;
  interactions: number;
  geo: GeoValue[];
  score: number;
  addedAt: string;
};

const palette = ["#04b19d", "#e7507a", "#f5f5f5", "#f3c552"];

const toNumber = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAd = (ad: AdsItem, index: number): Campaign => {
  const views = toNumber((ad as unknown as { views?: unknown }).views ?? ad.stats?.views ?? ad.stats?.vues);
  const interactions = toNumber(
    (ad as unknown as { interactions?: unknown }).interactions ??
      ad.stats?.interactions ??
      ad.stats?.clicks ??
      ad.stats?.conversions,
  );

  const geoRaw = ((ad as unknown as { geo?: unknown }).geo || (ad as unknown as { geos?: unknown }).geos || []) as
    | { label?: string; name?: string; value?: number; max?: number; total?: number; color?: string }[]
    | undefined;

  const geo: GeoValue[] = Array.isArray(geoRaw)
    ? geoRaw.map((g, idx) => ({
        label: g.label || g.name || `Zone ${idx + 1}`,
        value: toNumber(g.value ?? g.total ?? 0),
        max: toNumber(g.max ?? g.total ?? g.value ?? 0) || toNumber(g.value ?? g.total ?? 0) || 100,
        color: g.color || palette[idx % palette.length],
      }))
    : [];

  const addedAt = ad.createdAt || ad.startDate || new Date().toISOString();
  const number = String(ad.number ?? index + 1).padStart(2, "0");
  const poster = ad.poster || ad.banner || ad.image || ad.cover || "/pub_stat.jpg";
  const status = ad.status || "Actif";
  const score = toNumber(ad.score ?? ad.stats?.views ?? views + interactions);

  return {
    id: ad.id || `ad-${index}`,
    title: ad.title || ad.creativeTitle || ad.clientName || `Campagne ${index + 1}`,
    creative: ad.creativeTitle || ad.clientName || ad.title || `Créa ${index + 1}`,
    status,
    startDate: ad.startDate,
    endDate: ad.endDate || ad.startDate,
    number,
    poster,
    views,
    interactions,
    geo,
    score,
    addedAt,
  };
};

const statusOptions = [
  { label: "Tous les statuts", value: "all" },
  { label: "Actif", value: "Actif" },
  { label: "En pause", value: "En pause" },
  { label: "Brouillon", value: "Brouillon" },
];

const sortOptions = [
  { label: "Sans tri", value: "none" },
  { label: "Meilleures résultats", value: "best" },
  { label: "Dernier ajout", value: "latest" },
];

const periodOptions = [
  { label: "Dernier ajout", value: "dernier" },
  { label: "Semaine", value: "week" },
  { label: "Mois", value: "month" },
  { label: "Année", value: "year" },
];

export default function Page() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]); // Plus de mock, tableau vide par défaut
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortFilter, setSortFilter] = useState<string>("best");
  const [periodFilter, setPeriodFilter] = useState<string>("dernier");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adsApi.list({ page: 1, pageSize: 20 } , controller.signal);
        if (cancelled) return;
        const mapped = Array.isArray(res) ? res.map((ad, idx) => normalizeAd(ad, idx)) : [];
        setCampaigns(mapped);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Pubs", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [, toast]);

  const latestCampaignTimestamp = useMemo(() => {
    if (!campaigns.length) return Date.now();
    const timestamps = campaigns
      .map((camp) => new Date(camp.addedAt || camp.startDate || Date.now()).getTime())
      .filter((ts) => Number.isFinite(ts));
    return timestamps.length ? Math.max(...timestamps) : Date.now();
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const filtered = campaigns.filter((camp) => {
      if (statusFilter !== "all" && camp.status !== statusFilter) return false;

      const ts = new Date(camp.addedAt || camp.startDate || Date.now()).getTime();
      const diffDays = (latestCampaignTimestamp - ts) / (1000 * 60 * 60 * 24);

      if (periodFilter === "week") return diffDays <= 7;
      if (periodFilter === "month") return diffDays <= 30;
      if (periodFilter === "year") return diffDays <= 365;

      return true;
    });

    if (sortFilter === "best") {
      return [...filtered].sort((a, b) => b.score - a.score);
    }
    if (sortFilter === "latest") {
      return [...filtered].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
    return filtered;
  }, [campaigns, latestCampaignTimestamp, periodFilter, sortFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <Header title="Liste et statistiques de pubs" className="rounded-xl px-4 py-3" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterBtn
            title="Filtrer par statut"
            options={statusOptions}
            selected={statusFilter}
            onSelect={setStatusFilter}
          />
          <FilterBtn title="Meilleures résultats" options={sortOptions} selected={sortFilter} onSelect={setSortFilter} />
          <FilterBtn title="Dernier ajout" options={periodOptions} selected={periodFilter} onSelect={setPeriodFilter} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline btn-primary border-primary/60 text-white">Exporter les rapports</button>
          <Link href="/pub/new" className="btn btn-primary font-semibold">
            Créer un pub
          </Link>
        </div>
      </div>

      {loading && <div className="alert alert-info text-sm">Chargement des campagnes...</div>}
      {error && <div className="alert alert-error text-sm">{error}</div>}

      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {!loading && !error && filteredCampaigns.length === 0 && (
        <div className="text-sm text-white/70">Aucune campagne trouvée.</div>
      )}

      <div className="flex items-center justify-center gap-1 pt-2">
        {[1, 2, 3].map((page) => (
          <button key={page} className={`btn btn-xs ${page === 1 ? "btn-primary text-black" : "btn-ghost"}`}>
            {page}
          </button>
        ))}
        <button className="btn btn-xs btn-ghost px-3">▶</button>
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-200/60 p-4 shadow-lg">
      <div className="grid grid-cols-12 gap-4 items-start">
        <div className="col-span-12 lg:col-span-4 flex gap-4">
          <div className="relative h-32 w-48 overflow-hidden rounded-xl border border-base-300/60 bg-neutral/60 shadow-inner">
            <Image src={campaign.poster ?? ""} alt={campaign.creative} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-2 left-3">
              <p className="text-sm font-semibold text-white">{campaign.creative}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-between py-1 text-sm text-white/80">
            <div className="space-y-1">
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                {campaign.status}
              </span>
              <p>{campaign.startDate || "-"}</p>
              <p>{campaign.endDate || "-"}</p>
              <p className="text-white/60 text-xs">{campaign.number ? `N° ${campaign.number}` : ""}</p>
            </div>
            <button className="btn btn-primary btn-sm w-28 rounded-full font-semibold text-black">Modifier</button>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">{campaign.title}</h3>
        </div>

        <div className="col-span-12 sm:col-span-4 lg:col-span-3 rounded-xl bg-black/30 p-3">
          <p className="mb-2 text-sm font-semibold text-white/70">Statistique:</p>
          <div className="space-y-3">
            <StatChip icon={<Eye className="h-5 w-5" />} label="Vues" value={campaign.views} />
            <StatChip icon={<MousePointerClick className="h-5 w-5" />} label="Interactif" value={campaign.interactions} />
          </div>
        </div>

        <div className="col-span-12 sm:col-span-4 lg:col-span-3 rounded-xl bg-black/30 p-3">
          <p className="mb-2 text-sm font-semibold text-white/70">Données géographiques</p>
          <div className="space-y-3">
            {campaign.geo.map((geo) => (
              <GeoBar key={geo.label} {...geo} />
            ))}
            {!campaign.geo.length && (
              <div className="text-xs text-white/60">Pas de répartition géographique pour cette campagne.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300">
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold text-white">{value}</p>
        <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      </div>
    </div>
  );
}

function GeoBar({ label, value, max, color }: GeoValue) {
  const percentage = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-white/80">
        <span>{label}</span>
        <span>{value.toString().padStart(2, "0")}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-base-300/60">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}