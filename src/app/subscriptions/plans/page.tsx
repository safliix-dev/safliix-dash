'use client';

import Header from "@/ui/components/header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { plansApi } from "@/lib/api/subscriptions";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import DataTable from "@/ui/components/dataTable";
import { columns } from "./mapper";
import { PlanItem } from "@/types/api/subscriptions";
import { useDeleteWithConfirmation } from "@/lib/hooks/useDeletionWithConfirmation";
import ConfirmationDialog from "@/ui/components/confirmationDialog";



export default function Page() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAccessToken();
  const toast = useToast();
  const router = useRouter();


  const deletePlan = useDeleteWithConfirmation<PlanItem>({
      entityName: "le plan d'abonnement",
      getLabel: (p) => p.name,
      deleteFn: (id:string) => plansApi.delete(id, accessToken),
      onDeleted: (id:string) => setPlans((prev) => prev.filter((a) => a.id !== id)),
        
    });
    
      const isConfirmDisabled =
      deletePlan.confirmText !== "SUPPRIMER" ||
      deletePlan.status === "loading";

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await plansApi.list({ page: 1, pageSize: 20 }, accessToken);
        if (cancelled) return;
        
        setPlans(res.items);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Plans", description: friendly.message });
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

  return (
    <div className="space-y-5">
      <Header title="Plans d'abonnement" className="rounded-2xl border border-base-300 px-5 py-3">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/subscriptions/plans/edit" className="btn btn-primary btn-sm rounded-full">
            Créer un plan
          </Link>
          
        </div>
      </Header>

      {loading && <div className="alert alert-info text-sm">Chargement des plans...</div>}
      {error && <div className="alert alert-error text-sm">{error}</div>}

      
        <DataTable 
          data={plans} 
          columns={columns}
          actions={[
            {
              label: "Voir",
              className: "btn-info",
              onClick: (row) =>
                router.push(`/dashboard/subscriptions/plans/${row.id}`),
            },
            {
              label: "Modifier",
              className: "btn-warning",
              onClick: (row) =>
                router.push(`/dashboard/subscriptions/plans/edit/${row.id}`),
            },
            {
              label: "Supprimer",
              className: "btn-error",
              onClick: deletePlan.openDialog,
            },
          ]}
        />
      <ConfirmationDialog
          open={deletePlan.open}
          title="Suppression définitive"
          message={deletePlan.dialogMessage}
          status={deletePlan.status}
          resultMessage={deletePlan.resultMessage}
          confirmDisabled={isConfirmDisabled}
          onConfirm={deletePlan.confirmDelete}
          onCancel={deletePlan.closeDialog}
        >
          <div className="space-y-2">
            <p className="text-sm text-white/80">
              Tapez <strong className="text-red-400">SUPPRIMER</strong> pour confirmer :
            </p>
  
            <input
              type="text"
              value={deletePlan.confirmText}
              onChange={(e) => deletePlan.setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="input input-bordered w-full bg-base-200 border-red-500"
              disabled={deletePlan.status === "loading"}
            />
          </div>
        </ConfirmationDialog>  
    </div>
  );
}
