'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/ui/components/header";
import DataTable from "@/ui/components/dataTable";
import { rightsHolderColumns } from "./mapper";
import { ImageRightsHolder } from "@/types/api/imageRights";
import { imageRightsApi } from "@/lib/api/imageRights";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { formatApiError } from "@/lib/api/errors";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import { useDeleteWithConfirmation } from "@/lib/hooks/useDeletionWithConfirmation";

export default function Page() {
  const [holders, setHolders] = useState<ImageRightsHolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAccessToken();
  const toast = useToast();
  const router = useRouter();

  const deleteHolder = useDeleteWithConfirmation<ImageRightsHolder>({
    entityName: "le compte administrateur",
    getLabel: (a) => a.fullName ?? `${a.firstName} ${a.lastName}`,
    deleteFn: (id:string) => imageRightsApi.delete(id, accessToken),
    onDeleted: (id:string) => setHolders((prev) => prev.filter((a) => a.id !== id)),
      
  });
  
    const isConfirmDisabled =
    deleteHolder.confirmText !== "SUPPRIMER" ||
    deleteHolder.status === "loading";
  

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await imageRightsApi.list({ page: 1, pageSize: 20 }, accessToken);
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = Array.isArray((res as any)?.items) ? (res as any).items : Array.isArray(res) ? (res as any) : [];
        const mapped = items.map((holder) => ({
          ...holder,
          fullName: holder.fullName || `${holder.firstName ?? ""} ${holder.lastName ?? ""}`.trim(),
          films: holder.films ?? 0,
          series: holder.series ?? 0,
        }));
        setHolders(mapped);
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
  }, [accessToken, toast]);

  const stats = useMemo(
    () => ({
      total: holders.length,
      actifs: holders.filter((h) => h.status === "actif").length,
      pending: holders.filter((h) => h.status === "en attente").length,
      expires: holders.filter((h) => h.status === "expiré").length,
    }),
    [holders],
  );

  return (
    <div className="space-y-4">
      <Header title="Ayants droit image" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <div className="bg-base-200 px-3 py-2 rounded-lg border border-base-300">
            <span className="font-semibold text-white">{stats.total}</span>{" "}
            ayants droit référencés
          </div>
          <Link href="/dashboard/rights-holders/edit/new" className="btn btn-primary btn-sm rounded-full">
            Nouvel ayant droit
          </Link>
        </div>
      </Header>

      {loading && <div className="alert alert-info text-sm">Chargement des ayants droit...</div>}
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <div className="alert alert-warning bg-amber-900/40 border border-amber-600 text-sm text-amber-100">
        Rappel : seuls les films disponibles en mode abonnement sont couverts par ces droits image.
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral rounded-2xl border border-base-300 p-4">
          <p className="text-xs uppercase text-white/50">Actifs</p>
          <p className="text-2xl font-semibold text-success">{stats.actifs}</p>
          <p className="text-white/60 text-sm">Contrats exploitables</p>
        </div>
        <div className="bg-neutral rounded-2xl border border-base-300 p-4">
          <p className="text-xs uppercase text-white/50">En attente</p>
          <p className="text-2xl font-semibold text-warning">{stats.pending}</p>
          <p className="text-white/60 text-sm">Validation ou signature</p>
        </div>
        <div className="bg-neutral rounded-2xl border border-base-300 p-4">
          <p className="text-xs uppercase text-white/50">Expirés</p>
          <p className="text-2xl font-semibold text-error">{stats.expires}</p>
          <p className="text-white/60 text-sm">Renouvellement requis</p>
        </div>
        <div className="bg-neutral rounded-2xl border border-base-300 p-4">
          <p className="text-xs uppercase text-white/50">Couverture</p>
          <p className="text-2xl font-semibold text-primary">
            {holders.reduce((acc, h) => acc + h.films + h.series, 0)}
          </p>
          <p className="text-white/60 text-sm">Films & séries liés</p>
        </div>
      </div>

      <div>
        <DataTable 
          data={holders} 
          columns={rightsHolderColumns} 
          itemsPerPage={8}
          actions={[
            {
              label: "Voir",
              className: "btn-info",
              onClick: (row) =>
                router.push(`/dashboard/rights-holders/${row.id}`),
            },
            {
              label: "Modifier",
              className: "btn-warning",
              onClick: (row) =>
                router.push(`/dashboard/rights-holders/edit/${row.id}`),
            },
            {
              label: "Supprimer",
              className: "btn-error",
              onClick: deleteHolder.openDialog,
            },
          ]}
          />
        {holders.length === 0 && (
          <p className="text-sm text-white/70 mt-2">Aucun ayant droit pour le moment.</p>
        )}
      </div>

      <ConfirmationDialog
          open={deleteHolder.open}
          title="Suppression définitive"
          message={deleteHolder.dialogMessage}
          status={deleteHolder.status}
          resultMessage={deleteHolder.resultMessage}
          confirmDisabled={isConfirmDisabled}
          onConfirm={deleteHolder.confirmDelete}
          onCancel={deleteHolder.closeDialog}
        >
          <div className="space-y-2">
            <p className="text-sm text-white/80">
              Tapez <strong className="text-red-400">SUPPRIMER</strong> pour confirmer :
            </p>
  
            <input
              type="text"
              value={deleteHolder.confirmText}
              onChange={(e) => deleteHolder.setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="input input-bordered w-full bg-base-200 border-red-500"
              disabled={deleteHolder.status === "loading"}
            />
          </div>
        </ConfirmationDialog>
    </div>
  );
}
