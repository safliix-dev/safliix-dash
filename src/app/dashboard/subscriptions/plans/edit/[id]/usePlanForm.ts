'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { withRetry } from "@/lib/api/retry";
import { formatApiError } from "@/lib/api/errors";
import { plansApi } from "@/lib/api/subscriptions";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import type { DialogStatus } from "@/ui/components/confirmationDialog";
import { PlanForm } from "@/types/api/subscriptions";


export function usePlanForm(id:string) {
  const toast = useToast();
  const accessToken = useAccessToken();
  const isEdit = !!id && id !== "new";

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanForm>({
    defaultValues: {
      currency: "XOF",
      maxSharedAccounts: 1,
      quality: "HD",
    },
  });

  /* ---------------- confirmation dialog ---------------- */

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");
  const [dialogResult, setDialogResult] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanForm | null>(null);

  /** UI only */
  const [billingView, setBillingView] = useState<"mensuel" | "annuel">("mensuel");


  useEffect(() => {
      if (!isEdit) return;
  
      plansApi
        .getById(id!, accessToken)
        .then((data) => {
          reset({
            name: data.name,
            price: data.price,
            yearlyDiscount: data.yearlyDiscount,
            currency: data.currency as "XOF" | "EUR" | "USD",
            maxSharedAccounts: data.maxSharedAccounts,
            quality: data.videoQuality,
            description: data.description,
          });
        })
        .catch(() => {
          toast.error({
            title: "Chargement",
            description: "Impossible de charger le plan d'abonnement.",
          });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

  const openConfirm = handleSubmit((data) => {
    setPendingPlan(data);
    setDialogOpen(true);
    setDialogStatus("idle");
    setDialogResult(null);
  });

  const closeDialog = () => {
    if (dialogStatus === "loading") return;
    setDialogOpen(false);
    setDialogStatus("idle");
    setDialogResult(null);
    setPendingPlan(null);
  };

  /* ---------------- submit ---------------- */

  const confirmSubmit = async () => {
    if (!pendingPlan) return;

    setDialogStatus("loading");
    setDialogResult(null);

    console.dir(pendingPlan, { depth: 2});

    try {
      if(!isEdit){
        await withRetry(() =>
        plansApi.create(
          {
            name: pendingPlan.name,
            price: pendingPlan.price,
            yearlyDiscount: pendingPlan.yearlyDiscount,
            status: "active",
            maxSharedAccounts: pendingPlan.maxSharedAccounts,
            quality: pendingPlan.quality,
            currency: pendingPlan.currency,
          },
          accessToken,
        ),
      );

        setDialogStatus("success");
        setDialogResult("Plan mis à jour avec succès.");

        toast.success({
          title: "Plan",
          description: "Plan mis à jour avec succès.",
        });

        reset(pendingPlan);
        setTimeout(closeDialog, 800);
      }else{
        await withRetry(() =>
        plansApi.update(
          id,
          {
            
            name: pendingPlan.name,
            price: pendingPlan.price,
            yearlyDiscount: pendingPlan.yearlyDiscount,
            status: "active",
            maxSharedAccounts: pendingPlan.maxSharedAccounts,
            quality: pendingPlan.quality,
            currency: pendingPlan.currency,
          },
          accessToken,
        ),
      );

        setDialogStatus("success");
        setDialogResult("Plan créé avec succès.");

        toast.success({
          title: "Plan",
          description: "Plan créé avec succès.",
        });

        reset(pendingPlan);
        setTimeout(closeDialog, 800);
      }
      
    } catch (err) {
      const friendly = formatApiError(err);
      setDialogStatus("error");
      setDialogResult(friendly.message);

      toast.error({
        title: "Plan",
        description: friendly.message,
      });
    }
  };

  return {
    /* form */
    control,
    errors,
    isSubmitting,

    billingView,
    setBillingView,

    /* dialog */
    dialogOpen,
    dialogStatus,
    dialogResult,
    pendingPlan,

    /* actions */
    openConfirm,
    confirmSubmit,
    closeDialog,

    isEdit
  };
}
