'use client';

import { use, useEffect, useState } from "react";
import Header from "@/ui/components/header";
import Link from "next/link";
import { statsApi } from "@/lib/api/stats";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { type PubStatsDetail } from "@/types/api/stats";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pub, setPub] = useState<PubStatsDetail | null>(null);
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
        const res = await statsApi.pubDetail(id, accessToken);
        if (cancelled) return;
        setPub(res);
      } catch (err) {
        if (cancelled) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Campagne pub", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, toast, id]);

  return (
    <div className="space-y-5">
      <Header title="Détail campagne pub" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span className="badge badge-outline border-primary/50 text-primary">ID {id}</span>
          {pub?.status && (
            <>
              <span className="w-[1px] h-4 bg-base-300" />
              <span>Statut : {pub.status}</span>
            </>
          )}
        </div>
      </Header>

      {loading && <div className="alert alert-info text-sm">Chargement...</div>}
      {error && <div className="alert alert-error text-sm">{error}</div>}

      {!loading && !pub && !error && (
        <div className="text-sm text-white/70">Aucune donnée trouvée pour cette campagne.</div>
      )}

      {pub && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 bg-neutral rounded-2xl border border-base-300 p-4 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <img src={pub.poster || "/elegbara.png"} alt={pub.title} className="w-48 h-64 object-cover rounded-xl border border-base-300" />
              <div className="text-center space-y-1">
                <h2 className="text-xl font-semibold text-white">{pub.title}</h2>
                {pub.status && (
                  <span className={`badge ${pub.status === "Actif" ? "badge-success" : "badge-warning"}`}>{pub.status}</span>
                )}
              </div>
            </div>
            <div className="space-y-1 text-sm text-white/70">
              <p>Début : {pub.startDate || "-"}</p>
              <p>Fin : {pub.endDate || "-"}</p>
              <p>Budget : {pub.budget || "-"}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button className="btn btn-primary btn-sm rounded-full">Mettre en avant</button>
              <button className="btn btn-ghost btn-sm text-white border-base-300 rounded-full">Mettre en pause</button>
            </div>
          </div>

          <div className="col-span-8 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatTile label="Vues" value={pub.stats?.views ? String(pub.stats.views) : "-"} />
              <StatTile label="Conversions" value={pub.stats?.conversions ? String(pub.stats.conversions) : "-"} />
              <StatTile label="Clics CTA" value={pub.stats?.ctaClicks !== undefined ? String(pub.stats.ctaClicks) : "-"} />
              <StatTile label="Reach" value={pub.stats?.reach ? String(pub.stats.reach) : "-"} />
            </div>

            <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Répartition géographique</h3>
                <Link href="/dashboard/stats/pub" className="btn btn-ghost btn-xs text-primary border-primary/50 rounded-full">
                  Retour liste
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {pub.geo?.map((g) => (
                  <div key={g.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{g.label}</span>
                      <span>{g.value.toLocaleString()} f</span>
                    </div>
                    <progress className={`progress w-full ${g.color ?? "progress-primary"}`} value={g.value} max={g.max ?? g.value}></progress>
                  </div>
                ))}
                {!pub.geo?.length && <div className="text-sm text-white/60">Pas de géo-données.</div>}
              </div>
            </div>

            <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
              <h3 className="text-lg font-semibold text-white">Historique de campagne</h3>
              <ul className="space-y-2 text-sm text-white/80">
                {pub.activity?.map((a, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-base-200/30 border border-base-300 rounded-lg px-3 py-2">
                    <span>{a.label}</span>
                    <span className="text-xs text-white/50">{a.at}</span>
                  </li>
                ))}
                {!pub.activity?.length && (
                  <li className="text-sm text-white/60">Aucune activité enregistrée.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-1">
      <p className="text-xs uppercase text-white/50">{label}</p>
      <p className="text-xl font-semibold text-primary">{value}</p>
    </div>
  );
}
