'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Eye, TrendingUp, Target, Star, ListMusic,
  Calendar, Globe, Clock, Film, Pencil,
  Users, Award, MapPin, Tv, ChevronRight,
} from 'lucide-react';
import Header from '@/ui/components/header';
import { StatusBadge } from '@/ui/components/statusBadge';
import MonthlyStatsChart from '@/ui/specific/stats/components/barChart';
import { useSeriesDetail } from '../useSeriesDetail';
import { useContentDetailStats } from '@/lib/hooks/useContentDetailStats';
import { SeasonRow } from './SeasonRow';

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

export default function SeriesDetailClient() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id as string;

  const { detail, loading: detailLoading, seasons } = useSeriesDetail(seriesId);
  const { stats, loading: statsLoading } = useContentDetailStats('serie', seriesId);

  const revenueBarData = (stats?.revenueEvolution ?? []).map(p => ({
    label: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    Revenus: p.amount,
  }));

  const geoMax = Math.max(...(stats?.topCountries ?? []).map(c => c.value), 1);

  if (detailLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-dots loading-lg text-primary" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-white/40">Série introuvable.</p>
        <Link href="/series" className="btn btn-ghost btn-sm text-primary">← Retour</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header
        title={detail.title}
        backHref="/series"
        className="rounded-2xl border border-base-300 shadow-sm px-5"
      >
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <StatusBadge status={detail.status} size="sm" />
          {detail.category && (
            <span className="badge badge-outline border-white/20 text-white/60">{detail.category}</span>
          )}
          <button
            onClick={() => router.push(`/series/add?id=${seriesId}`)}
            className="btn btn-outline btn-primary btn-sm rounded-lg gap-1 ml-2"
          >
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
          <Link
            href={`/series/addSeason/${seriesId}`}
            className="btn btn-primary btn-sm rounded-lg gap-1"
          >
            + Saison
          </Link>
        </div>
      </Header>

      <div className="grid grid-cols-12 gap-4">

        {/* ── Colonne gauche ── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-neutral border border-base-300 rounded-2xl overflow-hidden">
            <div className="relative w-full aspect-[3/4]">
              <Image
                src={detail.poster || detail.hero || '/image-icon.jpg'}
                alt={detail.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="bg-neutral border border-base-300 rounded-2xl p-4 space-y-3 text-sm">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Informations</p>
            {[
              { icon: Film, label: 'Réalisateur', value: detail.director },
              { icon: Users, label: 'DP', value: detail.dp },
              { icon: Tv, label: 'Saisons', value: seasons.length ? `${seasons.length} saison${seasons.length > 1 ? 's' : ''}` : '—' },
              { icon: Globe, label: 'Langue', value: detail.mainLanguage },
              { icon: Calendar, label: 'Sortie', value: fmtDate(detail.releaseDate) },
              { icon: Calendar, label: 'Plateforme', value: fmtDate(detail.plateformDate ?? detail.publishDate) },
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
          {(detail.synopsis || detail.description) && (
            <div className="bg-neutral border border-base-300 rounded-2xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Synopsis</p>
              <p className="text-sm text-white/80 leading-relaxed">
                {detail.synopsis || detail.description}
              </p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Eye} label="Vues totales" value={fmt(stats?.overview.totalViews)} accent />
            <StatCard icon={TrendingUp} label="Revenus" value={stats?.overview.revenue ? `${fmt(stats.overview.revenue)} F` : '—'} accent />
            <StatCard icon={Target} label="Complétion" value={stats?.overview.completionRate ? `${stats.overview.completionRate}%` : '—'} sub="% jusqu'à la fin" />
            <StatCard icon={Clock} label="Durée moy./épisode" value={stats?.overview.avgWatchDurationMinutes ? `${stats.overview.avgWatchDurationMinutes} min` : '—'} />
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

          {/* Bas : Géo + Stats série */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Géo */}
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
                      <span className="text-white/50">{fmt(c.value)} vues</span>
                    </div>
                    <progress className="progress progress-primary w-full h-1.5" value={c.value} max={geoMax} />
                  </div>
                ))
              )}
            </div>

            {/* Stats spécifiques série */}
            <div className="bg-neutral border border-base-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary/60" />
                <p className="text-xs text-white/40 uppercase tracking-widest">Engagement série</p>
              </div>
              {!stats?.serieStats ? (
                <p className="text-sm text-white/30 italic">En attente des données</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Abonnés actifs ce mois</span>
                    <span className="text-white font-medium">{fmt(stats.serieStats.activeSubscribersThisMonth)}</span>
                  </div>

                  {stats.serieStats.mostWatchedEpisode && (
                    <div className="bg-base-300/20 rounded-xl p-3 space-y-1">
                      <p className="text-xs text-white/40 uppercase tracking-widest">Épisode le + vu</p>
                      <p className="text-white font-medium truncate">
                        S{stats.serieStats.mostWatchedEpisode.seasonNumber}E{stats.serieStats.mostWatchedEpisode.episodeNumber} — {stats.serieStats.mostWatchedEpisode.title}
                      </p>
                      <p className="text-primary text-xs">{fmt(stats.serieStats.mostWatchedEpisode.views)} vues</p>
                    </div>
                  )}

                  {stats.serieStats.seasonRetention.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-white/40 uppercase tracking-widest">Rétention inter-saisons</p>
                      {stats.serieStats.seasonRetention.map(r => (
                        <div key={`${r.fromSeason}-${r.toSeason}`} className="flex items-center gap-2 text-xs">
                          <span className="text-white/50">S{r.fromSeason}</span>
                          <ChevronRight className="w-3 h-3 text-white/20" />
                          <span className="text-white/50">S{r.toSeason}</span>
                          <div className="flex-1 h-1 bg-base-300 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${r.retentionRate}%` }}
                            />
                          </div>
                          <span className="text-white font-medium">{r.retentionRate}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Saisons & épisodes ── */}
      {seasons.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 pb-1">
            <Tv className="w-4 h-4 text-primary/60" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
              Saisons & épisodes
            </h2>
          </div>
          {seasons.map(season => (
            <SeasonRow key={season.id} season={season} seriesId={seriesId} />
          ))}
        </div>
      )}
    </div>
  );
}
