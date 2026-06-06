'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Eye, TrendingUp, Target, Star, ListMusic,
  Calendar, Globe, Clock, Film, ArrowLeft, Pencil,
  Users, Award, MapPin,
} from 'lucide-react';
import Header from '@/ui/components/header';
import { StatusBadge } from '@/ui/components/statusBadge';
import MonthlyStatsChart from '@/ui/specific/stats/components/barChart';
import { filmsApi } from '@/lib/api/films';
import { useContentDetailStats } from '@/lib/hooks/useContentDetailStats';
import type { FilmDetail } from '@/types/api/films';

const fmt = (n?: number | null) =>
  n === undefined || n === null ? '—' : n.toLocaleString('fr-FR');

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-base-200/40 border border-base-300 rounded-2xl p-4 space-y-2 hover:border-primary/30 transition">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40 uppercase tracking-widest">{label}</p>
        <Icon className={`w-4 h-4 ${accent ? 'text-primary' : 'text-white/20'}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default function FilmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [filmLoading, setFilmLoading] = useState(true);

  const { stats, loading: statsLoading } = useContentDetailStats('movie', id);

  useEffect(() => {
    filmsApi.detail(id)
      .then(setFilm)
      .catch(() => setFilm(null))
      .finally(() => setFilmLoading(false));
  }, [id]);

  const revenueBarData = (stats?.revenueEvolution ?? []).map(p => ({
    label: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    Revenus: p.amount,
  }));

  const geoMax = Math.max(...(stats?.topCountries ?? []).map(c => c.value), 1);

  if (filmLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-dots loading-lg text-primary" />
      </div>
    );
  }

  if (!film) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-white/40">Film introuvable.</p>
        <Link href="/films" className="btn btn-ghost btn-sm text-primary">← Retour</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header
        title={film.title}
        backHref="/films"
        className="rounded-2xl border border-base-300 shadow-sm px-5"
      >
        <div className="flex items-center gap-2 text-sm">
          <StatusBadge status={film.status} size="sm" />
          {film.category && (
            <span className="badge badge-outline border-white/20 text-white/60">{film.category}</span>
          )}
          <button
            onClick={() => router.push(`/films/add?id=${id}`)}
            className="btn btn-outline btn-primary btn-sm rounded-lg gap-1 ml-2"
          >
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
        </div>
      </Header>

      <div className="grid grid-cols-12 gap-4">

        {/* ── Colonne gauche ── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-neutral border border-base-300 rounded-2xl overflow-hidden">
            <div className="relative w-full aspect-[3/4]">
              <Image
                src={film.poster || film.hero || '/image-icon.jpg'}
                alt={film.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="bg-neutral border border-base-300 rounded-2xl p-4 space-y-3 text-sm">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Informations</p>

            {[
              { icon: Film, label: 'Réalisateur', value: film.director },
              { icon: Users, label: 'DP', value: film.dp },
              { icon: Clock, label: 'Durée', value: film.duration ? `${film.duration} min` : '—' },
              { icon: Globe, label: 'Langue', value: film.mainLanguage || film.language },
              { icon: Calendar, label: 'Sortie', value: fmtDate(film.releaseDate) },
              { icon: Calendar, label: 'Plateforme', value: fmtDate(film.plateformDate ?? film.publishDate) },
              { icon: TrendingUp, label: 'Prix location', value: film.rentalPrice ? `${fmt(film.rentalPrice)} FCFA` : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 text-white/70">
                <Icon className="w-4 h-4 text-white/30 shrink-0" />
                <span className="text-white/40 w-28 shrink-0">{label}</span>
                <span className="text-white truncate">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Synopsis */}
          {(film.synopsis || film.description) && (
            <div className="bg-neutral border border-base-300 rounded-2xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Synopsis</p>
              <p className="text-sm text-white/80 leading-relaxed">
                {film.synopsis || film.description}
              </p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Eye} label="Vues totales" value={fmt(stats?.overview.totalViews)} accent />
            <StatCard icon={TrendingUp} label="Revenus" value={stats?.overview.revenue ? `${fmt(stats.overview.revenue)} F` : '—'} accent />
            <StatCard icon={Target} label="Complétion" value={stats?.overview.completionRate ? `${stats.overview.completionRate}%` : '—'} sub="% jusqu'à la fin" />
            <StatCard icon={Clock} label="Durée moy." value={stats?.overview.avgWatchDurationMinutes ? `${stats.overview.avgWatchDurationMinutes} min` : '—'} />
            <StatCard icon={Star} label="Note moy." value={stats?.overview.avgRating ? `${stats.overview.avgRating}/5` : '—'} />
            <StatCard icon={ListMusic} label="Playlists" value={fmt(stats?.overview.playlistAddCount)} />
          </div>

          {/* Revenus 30 jours */}
          <div className="bg-neutral border border-base-300 rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Évolution des revenus — 30 jours</p>
            {statsLoading ? (
              <div className="flex justify-center h-48 items-center">
                <span className="loading loading-dots loading-md text-primary" />
              </div>
            ) : (
              <MonthlyStatsChart
                data={revenueBarData}
                keys={['Revenus']}
                colors={{ Revenus: '#0da36d' }}
                emptyLabel="En attente des données backend"
              />
            )}
          </div>

          {/* Bas : Géo + Stats film */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Répartition géographique */}
            <div className="bg-neutral border border-base-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary/60" />
                <p className="text-xs text-white/40 uppercase tracking-widest">Répartition géo</p>
              </div>
              {(stats?.topCountries ?? []).length === 0 ? (
                <p className="text-sm text-white/30 italic">En attente des données</p>
              ) : (
                stats!.topCountries.map(c => (
                  <div key={c.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{c.label}</span>
                      <span className="text-white/50">{fmt(c.value)} F</span>
                    </div>
                    <progress className="progress progress-primary w-full h-1.5" value={c.value} max={geoMax} />
                  </div>
                ))
              )}
            </div>

            {/* Stats spécifiques film */}
            <div className="bg-neutral border border-base-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary/60" />
                <p className="text-xs text-white/40 uppercase tracking-widest">Détail locations</p>
              </div>
              {!stats?.filmStats ? (
                <p className="text-sm text-white/30 italic">En attente des données</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Locations totales', value: fmt(stats.filmStats.totalRentals) },
                    { label: 'Vues abonnement', value: fmt(stats.filmStats.totalSubscriptionViews) },
                    { label: 'Revenus location', value: `${fmt(stats.filmStats.rentalRevenue)} F` },
                    { label: 'Revenus abonnement', value: `${fmt(stats.filmStats.subscriptionRevenue)} F` },
                    { label: 'Pic le', value: fmtDate(stats.filmStats.peakRentalDate) },
                    { label: 'Locations ce jour', value: fmt(stats.filmStats.peakRentalCount) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/40">{label}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
