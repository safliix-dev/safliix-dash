"use client";

import Header from "@/ui/components/header";
import { useEffect, useState } from "react";
import { introApi } from "@/lib/api/reports";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";

type IntroResource = { id: string; title: string; url: string; type?: string };

export default function Page(){
  const [resources, setResources] = useState<IntroResource[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
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
        const res = await introApi.resources(accessToken);
        if (cancelled) return;
        setResources(res.items);
        setSelected(res.items[0]?.id || null);
      } catch (err) {
        if (cancelled) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Intro", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, toast]);

  const current = resources.find((r) => r.id === selected);

  return (
    <div>
      <Header title="Intro vidéo" className="bg-base-100 shadow-lg shadow-white px-3"/>

      <div className="mt-4">
        {loading && <div className="alert alert-info text-sm">Chargement des intros...</div>}
        {error && <div className="alert alert-error text-sm">{error}</div>}
        <div className="flex items-center justify-center">
          {current ? (
            <video
              src={current.url}
              controls
              className="w-full max-w-4xl h-[300px] rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-white/70 text-sm">Aucune vidéo disponible.</div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-evenly">
          <button className="btn btn-primary rounded-full btn-sm" disabled={!current}>
            Appliquer intro
          </button>
          <select
            className="select select-bordered w-48"
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="" disabled>
              Sélectionner une intro
            </option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>    
          <button className="btn btn-primary rounded-full btn-sm" disabled>
            Ajouter intro
          </button>
        </div>

      </div>
    </div>
  )

}
