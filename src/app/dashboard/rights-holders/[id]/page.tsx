'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/ui/components/header";
import { rightsHoldersMock } from "../data";
import { LinkedContent } from "@/types/api/imageRights";
import { imageRightsApi } from "@/lib/api/imageRights";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { formatApiError } from "@/lib/api/errors";
import Image from "next/image";
const placeholderAvatar = "/gildas.png";

const statusBadge: Record<string, string> = {
  actif: "badge-success",
  "en attente": "badge-warning",
  expiré: "badge-error",
};

export default function Page() {
  const routeParams = useParams<{ id: string }>();
  const holderId = routeParams?.id;
  const [filter, setFilter] = useState<"all" | "film" | "serie">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAccessToken();
  const toast = useToast();

  const [holder, setHolder] = useState(() => {
    const found = holderId ? rightsHoldersMock.find((h) => h.id === holderId) : undefined;
    if (!found) return undefined;
    return { ...found, fullName: found.fullName || `${found.firstName} ${found.lastName}` };
  });

  useEffect(() => {
    if (!holderId) return;
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await imageRightsApi.detail(holderId, accessToken);
        if (cancelled) return;
        setHolder({
          ...res,
          fullName: res.fullName || `${res.firstName} ${res.lastName}`,
        });
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Ayants droit", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [holderId, accessToken, toast]);

  const filteredContents = useMemo(() => {
    if (!holder) return [];
    const contents = holder.linkedContents || [];
    return filter === "all" ? contents : contents.filter((c) => c.type === filter);
  }, [holder, filter]);

  if (!holder) {
    return (
      <div className="space-y-3">
        <Header title="Ayant droit introuvable" />
        <p className="text-white/70 text-sm">Aucun ayant droit avec cet identifiant.</p>
        <Link href="/dashboard/rights-holders" className="btn btn-primary btn-sm rounded-full w-fit">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const hasExpired = holder.status === "expiré";

  const renderContentCard = (content: LinkedContent) => {
    const href = content.type === "film" ? `/dashboard/films/detail/${content.id}` : `/dashboard/series/detail/${content.id}`;
    const tone =
      content.status === "Publié"
        ? "badge-success"
        : content.status === "Expiré"
          ? "badge-error"
          : "badge-warning";

    return (
      <div key={content.id} className="border border-base-300 rounded-2xl bg-neutral p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="badge badge-outline border-primary/60 text-primary uppercase">{content.type}</span>
            <span className={`badge badge-sm ${tone}`}>{content.status || "En cours"}</span>
          </div>
          <Link href={href} className="btn btn-ghost btn-xs text-primary border-primary/40 rounded-full">
            Ouvrir
          </Link>
        </div>
        <div className="flex gap-3">
          <Image
            width={48}
            height={48}
            src={content.poster || "/image-icon.jpg"}
            alt={content.title}
            className="w-20 h-24 object-cover rounded-xl border border-base-300"
          />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">{content.title}</h3>
            <p className="text-sm text-white/70">{content.role}</p>
            <p className="text-xs text-white/60">
              Usage : {content.usageScope || "N/A"} · Période : {content.period || "-"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
      <div className="space-y-4">
        <Header title={`Ayant droit · ${holder.fullName}`} className="rounded-2xl border border-base-300 shadow-sm px-5">
          <div className="flex items-center gap-3 text-sm text-white/80">
            <span className={`badge ${statusBadge[holder.status] || "badge-ghost"}`}>{holder.status}</span>
            <span className="w-[1px] h-4 bg-base-300" />
            <span>Dernière mise à jour : {holder.lastUpdate || "N/A"}</span>
            <span className="badge badge-outline border-primary/60 text-primary">
              Partage {holder.sharePercentage}%
            </span>
            <Link href="/dashboard/rights-holders" className="btn btn-ghost btn-xs border-base-300 text-white rounded-full">
              Retour liste
            </Link>
            <Link href="/dashboard/rights-holders/add" className="btn btn-primary btn-xs rounded-full">
              Ajouter un droit
            </Link>
          </div>
        </Header>

        {loading && <div className="alert alert-info text-sm">Chargement des informations...</div>}
        {error && <div className="alert alert-error text-sm">{error}</div>}
        <div className="alert alert-warning bg-amber-900/40 border border-amber-700 text-sm text-amber-100">
          Note : l’application des droits concerne uniquement les films disponibles en abonnement.
        </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-neutral rounded-2xl border border-base-300 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="mask mask-squircle h-16 w-16">
                <Image
                  width={48}
                  height={48} 
                  src={holder.avatar || placeholderAvatar} alt={holder.fullName} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{holder.fullName}</h2>
              <p className="text-white/70 text-sm">{holder.role}</p>
              <p className="text-white/60 text-sm">{holder.email}</p>
              <p className="text-white/60 text-sm">{holder.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
            <div className="rounded-xl bg-base-200/40 border border-base-300 p-3">
              <p className="text-xs uppercase text-white/50">Films</p>
              <p className="text-xl font-semibold text-primary">{holder.films}</p>
            </div>
            <div className="rounded-xl bg-base-200/40 border border-base-300 p-3">
              <p className="text-xs uppercase text-white/50">Séries</p>
              <p className="text-xl font-semibold text-primary">{holder.series}</p>
            </div>
            <div className="rounded-xl bg-base-200/40 border border-base-300 p-3 col-span-2">
              <p className="text-xs uppercase text-white/50">Couverture</p>
              <p className="text-sm text-white/80">{holder.scope}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-white/70">
            <p>Début de droits : {holder.startedAt || "-"}</p>
            <p>Expiration : {holder.expiresAt || "-"}</p>
            {holder.guardian && <p>Représentant légal : {holder.guardian}</p>}
          </div>
          {hasExpired && (
            <div className="alert alert-warning text-xs">
              Les droits sont expirés, un renouvellement est requis avant toute diffusion.
            </div>
          )}
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm rounded-full">Télécharger contrat</button>
            <button className="btn btn-ghost btn-sm text-white border-base-300 rounded-full">Renouveler</button>
          </div>
        </div>

        <div className="col-span-8 space-y-3">
          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-white/50">Mentions légales</p>
                <h3 className="text-lg font-semibold text-white">Périmètre d&apos;utilisation</h3>
              </div>
              <span className="badge badge-outline border-primary/60 text-primary">
                {(holder.linkedContents || []).length} contenus liés
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{holder.legalMentions}</p>
          </div>

          {holder.notes && (
            <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
              <p className="text-xs uppercase text-white/50">Notes</p>
              <p className="text-white/70 text-sm">{holder.notes}</p>
            </div>
          )}

          {holder.documents && (
            <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Documents</h3>
                <button className="btn btn-ghost btn-xs text-primary border-primary/40 rounded-full">Joindre</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {holder.documents.map((doc, idx) => (
                  <div key={idx} className="border border-base-300 rounded-xl p-3 bg-base-200/30 space-y-1">
                    <p className="font-semibold text-white">{doc.label}</p>
                    <p className="text-white/60 text-sm">{doc.type}</p>
                    <p className="text-white/50 text-xs">{doc.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Films & séries liés</h3>
            <div className="tabs tabs-boxed bg-base-200/40 border border-base-300 rounded-xl">
              <button
                className={`tab px-3 text-sm ${filter === "all" ? "tab-active text-primary font-semibold" : "text-white/60"}`}
                onClick={() => setFilter("all")}
              >
                Tous
              </button>
              <button
                className={`tab px-3 text-sm ${filter === "film" ? "tab-active text-primary font-semibold" : "text-white/60"}`}
                onClick={() => setFilter("film")}
              >
                Films
              </button>
              <button
                className={`tab px-3 text-sm ${filter === "serie" ? "tab-active text-primary font-semibold" : "text-white/60"}`}
                onClick={() => setFilter("serie")}
              >
                Séries
              </button>
            </div>
          </div>
          <Link href="/dashboard/films/add" className="btn btn-primary btn-sm rounded-full">
            Associer un contenu
          </Link>
        </div>

        {filteredContents.length === 0 && (
          <p className="text-sm text-white/70">Aucun contenu pour ce filtre.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filteredContents.map((content) => renderContentCard(content))}
        </div>
      </div>
    </div>
  );
}
