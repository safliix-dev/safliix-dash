'use client';

import Header from "@/ui/components/header";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { plansApi } from "@/lib/api/subscriptions";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import type { PlanDetail } from "@/types/api/subscriptions";

export default function Page({ params }: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planParams = (params as any)?.then ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const planId = planParams.id;
  const accessToken = useAccessToken();
  const toast = useToast();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await plansApi.detail(planId, accessToken, controller.signal);
        if (cancelled) return;
        setPlan(res);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Plan", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accessToken, planId, toast]);

  const statsPreview = useMemo(
    () => [
      { label: "Abonnés actifs", value: plan?.devices ? `${plan.devices * 10}` : "—" },
      { label: "Revenu mensuel estimé", value: plan?.price ? `${plan.price.toLocaleString()} ${plan.currency || ""}` : "—" },
      { label: "Taux de churn (placeholder)", value: "2,1%" },
    ],
    [plan],
  );

  return (
    <div className="space-y-5">
      <Header title="Détail plan" className="rounded-2xl border border-base-300 px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <span className="badge badge-outline border-primary/50 text-primary">ID {planId}</span>
          {plan?.status && <span className="badge badge-success badge-outline">{plan.status}</span>}
        </div>
      </Header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-neutral rounded-2xl border border-base-300 p-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">{plan?.name || "Plan"}</h2>
            {plan?.description ? (
              <p className="text-white/70 text-sm">{plan.description}</p>
            ) : (
              <p className="text-white/60 text-sm italic">Description indisponible.</p>
            )}
            {plan?.status && (
              <span className={`badge ${plan.status?.toLowerCase() === "actif" ? "badge-success" : "badge-ghost"}`}>
                {plan.status}
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm text-white/70">
            <p>
              Tarif : {plan?.price?.toLocaleString() ?? "—"} {plan?.currency || ""} · {plan?.period || "—"}
            </p>
            <p>Appareils simultanés : {plan?.devices ?? "—"}</p>
            <p>Qualité max : {plan?.quality ?? "—"}</p>
            <p>Essai : —</p>
          </div>
          {plan?.features?.length ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {plan.features.map((perk, idx) => (
                <span key={idx} className="badge badge-outline border-primary/40 text-primary">
                  {perk}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/50 pt-1">Aucun avantage renseigné.</div>
          )}
          <div className="flex items-center gap-2 pt-2">
            <button className="btn btn-ghost btn-sm border-base-300 rounded-full" disabled>
              Mettre à jour
            </button>
            <button className="btn btn-ghost btn-sm border-base-300 rounded-full" disabled>
              Archiver
            </button>
          </div>
          {error && <div className="alert alert-warning text-sm">{error}</div>}
          {loading && <div className="text-xs text-white/60">Chargement du plan...</div>}
        </div>

        <div className="col-span-8 space-y-4">
          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Activité</h3>
              <Link href="/dashboard/subscriptions/plans" className="btn btn-ghost btn-xs text-primary border-primary/50 rounded-full">
                Retour liste
              </Link>
            </div>
            <div className="text-sm text-white/70 italic">Aucune activité disponible. Branchez la source de données.</div>
          </div>

          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Aperçu (statique)</h3>
              <span className="text-xs text-white/50">Bientôt connecté aux stats</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {statsPreview.map((stat) => (
                <div key={stat.label} className="bg-base-200/40 border border-base-300 rounded-lg px-3 py-2">
                  <p className="text-xs text-white/60">{stat.label}</p>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
