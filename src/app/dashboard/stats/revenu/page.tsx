'use client';

import { useEffect, useMemo, useState } from "react";
import MonthlyStatsChart from "@/ui/specific/stats/components/barChart";
import { statsApi } from "@/lib/api/stats";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { type RevenueStatsResponse } from "@/types/api/stats";

const formatNumber = (value?: number) =>
  value === undefined || value === null ? "-" : value.toLocaleString("fr-FR");

const toBarData = (series: RevenueStatsResponse["series"]) => {
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
  const [stats, setStats] = useState<RevenueStatsResponse | null>(null);
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
        const res = await statsApi.revenue(undefined, accessToken);
        if (cancelled) return;
        setStats(res);
      } catch (err) {
        if (cancelled) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Stats revenus", description: friendly.message });
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

  const totals = stats?.totals ?? {};
  const totalsEntries = Object.entries(totals);

  return (
    <div className="flex gap-4 ">
      <div className="flex-2 ">
        <div className="flex items-center gap-4 h-58  p-10 mb-4 shadow-md shadow-base-200 rounded-lg bg-neutral">
          <div className="flex-1">
            <img src="/shape.png" alt="" />
            <h4 className="font-bold">Total Revenu</h4>
          </div>
          <div className="flex-4 p-10">
            <h4 className="mb-4">Analyse</h4>
            <p className="mb-4">Vue d&apos;ensemble</p>
            <div className="flex items-center gap-8 flex-wrap">
              {totalsEntries.length === 0 && (
                <div className="text-sm text-white/70">Aucune donnée de revenu disponible.</div>
              )}
              {totalsEntries.map(([label, value]) => (
                <Card
                  key={label}
                  title={formatNumber(value)}
                  desc={label}
                  stat={0}
                  iconPath="/diamond.png"
                  bgColor="#00BA9D"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 shadow-md shadow-base-200 rounded-lg bg-neutral">
          <MonthlyStatsChart
            data={barData}
            keys={barKeys}
            indexBy="label"
            emptyLabel={loading ? "Chargement..." : "Pas de données de revenus disponibles"}
          />
          {error && <div className="text-sm text-error mt-2">{error}</div>}
        </div>
      </div>
      <div className="flex-1">
        <div className="relative h-58  p-4 mb-4 shadow-md shadow-base-200 rounded-lg" style={{backgroundImage: 'url("/bg_stat_card.png")',backgroundRepeat:'no-repeat',backgroundPosition: 'center',backgroundSize:"cover"} }>
          <div className="absolute top-20 right-4">
            <h1 className="text-2xl font-bold text-gray-200 ml-2">{formatNumber(totals.total ?? totals.subscriptions ?? totals.rentals)}</h1>
            <p className="text-sm text-gray-200 font-bold">revenu total SaFliix</p>
          </div>
        </div>
        <div className="p-4 shadow-md shadow-base-200 rounded-lg bg-neutral">
          <h2 className="text-xl font-bold mb-4">Total Report</h2>
          <p className="mb-4">Toutes les périodes (selon filtre appliqué)</p>
          <div className="w-full space-y-3">
            {totalsEntries.length === 0 && (
              <div className="text-sm text-white/70">Aucun total disponible.</div>
            )}
            {totalsEntries.map(([label, value]) => (
              <StatCard key={label} title={label} value={value ?? 0} stat={0}/>
            ))}
          </div>
          <button className="btn btn-primary rounded-full w-full py-2 mt-4">Plus de détail</button>
        </div>
      </div>
    </div>
  );
}


const StatCard = ({title,value,stat} : {title:string; value:number;stat:number})  => 
   (
    <div className="flex items-center justify-between w-full mb-5">
      <div className="flex items-center gap-2">
        <div className="bg-white h-10 w-10 rounded-md"/>
        <h4 className="font-bold text-lg capitalize">{title}</h4>
      </div>
      
      <h4>{`${formatNumber(value)} CFA`}</h4>

      <div className="flex items-center gap-2">
        <span className="text-primary text-sm font-bold">{stat ? `${stat}%` : "-"}</span>
      </div>
    </div>
  );

const Card = ({title,desc,stat,iconPath,bgColor} : {title:string; desc:string;stat:number; iconPath:string;bgColor:string}) => (
  <div className="flex gap-4 items-start">
    <div className={`flex items-center justify-center h-10 w-10 p-2 rounded-md`} style={{background:`${bgColor}`}}>
      <img src={iconPath} alt="icon" className="h-4 w-5"/>
    </div>
    <div className="">
      <h3 className="font-bold text-xl">{title}</h3>
      <p className="text-[8px] text-gray font-bold capitalize">{desc}</p>
      <div className="mt-5 flex items-center gap-2">
        <span className="text-sm text-primary">{stat ? `${stat}%` : "-"}</span>
      </div>
    </div>
  </div>
)
