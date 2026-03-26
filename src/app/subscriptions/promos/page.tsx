'use client';

import Header from "@/ui/components/header";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { formatApiError } from "@/lib/api/errors";
import DataTable from "@/ui/components/dataTable";
import { columns } from "./mapper";
import { PromotionItem } from "@/types/api/subscriptions";
import { promosApi } from "@/lib/api/subscriptions";
import { useRouter } from "next/navigation";
import { useDeleteWithConfirmation } from "@/lib/hooks/useDeletionWithConfirmation";
import ConfirmationDialog from "@/ui/components/confirmationDialog";


export default function Page() {
  const accessToken = useAccessToken();
  const toast = useToast();
  const [promos, setPromos] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const deletePromo = useDeleteWithConfirmation<PromotionItem>({
    entityName: "la promotion",
    getLabel: (p) => p.name,
    deleteFn: (id:string) => promosApi.delete(id, accessToken),
    onDeleted: (id:string) => setPromos((prev) => prev.filter((a) => a.id !== id)),
      
  });
      
  const isConfirmDisabled =
  deletePromo.confirmText !== "SUPPRIMER" ||
  deletePromo.status === "loading";
  

  const fetchPromos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await promosApi.list({ page: 1, pageSize: 20 },accessToken);
      setPromos(res);
    } catch (err) {
      const friendly = formatApiError(err);
      setError(friendly.message);
      toast.error({ title: "Promotions", description: friendly.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  

  const rows = useMemo(
    () =>
      promos.map((promo) => ({
        ...promo,
        start: promo.startDate ? new Date(promo.startDate).toLocaleDateString("fr-FR") : "—",
        end: promo.endDate ? new Date(promo.endDate).toLocaleDateString("fr-FR") : "—",
      })),
    [promos],
  );

  return (
    <div className="space-y-5">
      <Header title="Promotions" className="rounded-2xl border border-base-300 px-5 py-3">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/subscriptions/promos/edit/new" className="btn btn-primary btn-sm rounded-full">
            Créer une promo
          </Link>
          
        </div>
      </Header>

      {loading && <div className="alert alert-info text-sm">Chargement des promotions...</div>}
      {error && <div className="alert alert-error text-sm">{error}</div>}

      <DataTable 
        data={rows} 
        columns={columns}
        actions={[
            
            {
              label: "Modifier",
              className: "btn-warning",
              onClick: (row) =>
                router.push(`/dashboard/subscriptions/promos/edit/${row.id}`),
            },
            {
              label: "Supprimer",
              className: "btn-error",
              onClick: deletePromo.openDialog,
            },
          ]}
      />
      <ConfirmationDialog
          open={deletePromo.open}
          title="Suppression définitive"
          message={deletePromo.dialogMessage}
          status={deletePromo.status}
          resultMessage={deletePromo.resultMessage}
          confirmDisabled={isConfirmDisabled}
          onConfirm={deletePromo.confirmDelete}
          onCancel={deletePromo.closeDialog}
        >
          <div className="space-y-2">
            <p className="text-sm text-white/80">
              Tapez <strong className="text-red-400">SUPPRIMER</strong> pour confirmer :
            </p>
  
            <input
              type="text"
              value={deletePromo.confirmText}
              onChange={(e) => deletePromo.setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="input input-bordered w-full bg-base-200 border-red-500"
              disabled={deletePromo.status === "loading"}
            />
          </div>
        </ConfirmationDialog>
    </div>
  );
}
