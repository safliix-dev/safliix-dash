'use client';

import { useEffect, useMemo, useState } from "react";
import Header from "@/ui/components/header";
import { Download } from "lucide-react";
import MonthlyStatsChart from "@/ui/specific/stats/components/barChart";
import { statsApi } from "@/lib/api/stats";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { type FilmsStatsResponse } from "@/types/api/stats";

const formatNumber = (value?: number) =>
  value === undefined || value === null ? "-" : value.toLocaleString("fr-FR");

const toBarData = (series: FilmsStatsResponse["series"]) => {
  const keys = series.map((s) => s.name);
  const map = new Map<string, Record<string, number>>();
  series.forEach((s) => {
    s.data.forEach((point) => {
      const current = map.get(point.label) || {};
      current[s.name] = point.value;
      map.set(point.label, current);
    });
  });
  const data = Array.from(map.entries()).map(([label, values]) => ({ label, ...values }));
  return { keys, data };
};

export default function Page() {
  const [stats, setStats] = useState<FilmsStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAccessToken();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await statsApi.films(undefined, accessToken);
        if (cancelled) return;
        setStats(res);
      } catch (err) {
        if (cancelled) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Stats films", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, toast]);

  const { data: barData, keys: barKeys } = useMemo(
    () => toBarData(stats?.series ?? []),
    [stats?.series],
  );

  const summaryEntries = Object.entries(stats?.summary ?? {});

  return (
    <div className="space-y-4">
      <Header title="Détails revenus" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3">
          <button className="btn btn-primary btn-sm rounded-lg">
            <Download className="w-4 h-4"/>
            <span className="ml-1">Exporter les rapports</span>
          </button>
          {loading && <div className="bg-base-200 px-3 py-2 rounded-lg border border-base-300 text-sm text-white/80">Chargement...</div>}
          {error && <div className="text-sm text-error">{error}</div>}
        </div>
      </Header>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-neutral border border-base-300 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Analyse</h2>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"/>
              <span>Vue globale</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-base-200/40 rounded-xl p-4 border border-base-300 flex flex-col justify-center items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-lg font-semibold">
                Revenu
              </div>
              <p className="mt-2 text-white/80 text-sm">rapport</p>
            </div>
            {summaryEntries.length === 0 && (
              <div className="col-span-3 text-sm text-white/70 bg-base-200/30 rounded-xl p-4 border border-base-300">
                Aucune statistique disponible pour le moment.
              </div>
            )}
            {summaryEntries.map(([label, value]) => (
              <div key={label} className="bg-base-200/40 rounded-xl p-4 border border-base-300 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-white/80 text-sm capitalize">
                  {label}
                </div>
                <div className="text-2xl font-bold text-white">{formatNumber(value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral border border-base-300 rounded-2xl p-6 flex items-center justify-center">
          <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-green-400/60 via-cyan-400/40 to-blue-500/40 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">{formatNumber(stats?.totals?.total ?? stats?.summary?.total)}</div>
              <p className="text-sm text-white/70">revenu total SaFliix</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-neutral border border-base-300 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Sales Statistic</h3>
              <p className="text-xs text-white/60">Revenue vs Expense</p>
            </div>
          </div>
          <div className="h-72 mt-4">
            <MonthlyStatsChart
              data={barData}
              keys={barKeys}
              indexBy="label"
              emptyLabel="Pas de données de ventes disponibles"
            />
          </div>
        </div>

        <div className="bg-neutral border border-base-300 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Total Report</h3>
          <p className="text-xs text-white/60">Période selon le filtre appliqué</p>
          <div className="space-y-3">
            {summaryEntries.length === 0 && (
              <div className="text-sm text-white/70">Aucun total disponible.</div>
            )}
            {summaryEntries.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between bg-base-200/30 p-3 rounded-lg border border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-base-200 border border-base-300"/>
                  <div>
                    <div className="text-sm text-white font-semibold capitalize">{label}</div>
                    <div className="text-xs text-white/60">{formatNumber(value)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary w-full rounded-full mt-4">Plus de détail</button>
        </div>
      </div>
    </div>
  );
}
