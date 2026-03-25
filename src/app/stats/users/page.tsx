'use client';

import { useEffect, useMemo, useState } from "react";
import MonthlyStatsChart from "@/ui/specific/stats/components/barChart";
import Header from "@/ui/components/header";
import { statsApi } from "@/lib/api/stats";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { type UsersStatsResponse } from "@/types/api/stats";

const toBarData = (series: UsersStatsResponse["series"]) => {
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

export default function Page(){
  const [stats, setStats] = useState<UsersStatsResponse | null>(null);
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
        const res = await statsApi.users(undefined, accessToken);
        if (cancelled) return;
        setStats(res);
      } catch (err) {
        if (cancelled) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Stats utilisateurs", description: friendly.message });
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
    <div className="p-4 space-y-4">
      <Header title="Statistiques utilisateurs"/>
      {loading && <div className="alert alert-info text-sm">Chargement des stats...</div>}
      {error && <div className="alert alert-error text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-neutral border border-base-300 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Évolution</h3>
          <MonthlyStatsChart
            data={barData}
            keys={barKeys}
            indexBy="label"
            emptyLabel={loading ? "Chargement..." : "Aucune donnée utilisateur"}
          />
        </div>
        <div className="bg-neutral border border-base-300 rounded-2xl p-6 space-y-2">
          <h3 className="text-lg font-semibold text-white">Résumé</h3>
          {summaryEntries.length === 0 && (
            <p className="text-sm text-white/70">Pas de résumé disponible.</p>
          )}
          {summaryEntries.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-sm bg-base-200/30 rounded-lg px-3 py-2 border border-base-300">
              <span className="capitalize text-white/80">{label}</span>
              <span className="text-white font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
