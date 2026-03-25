'use client';

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { promosApi } from "@/lib/api/subscriptions";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import type { DialogStatus } from "@/ui/components/confirmationDialog";
import type { PromotionPayload, PromotionPayloadUpdate } from "@/types/api/subscriptions";

// Union type pour couvrir la création (complet) et l'update (partiel)
type PendingPromotionData = PromotionPayload | PromotionPayloadUpdate;

export function usePromoForm(id?: string) {
  const isEdit = !!id && id !== "new";
  const toast = useToast();
  const accessToken = useAccessToken();

  /* ---------------- Form Configuration ---------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<PromotionPayload>({
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      isActive: true,
    },
  });

  /* ---------------- UI States ---------------- */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");
  const [dialogResult, setDialogResult] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<PendingPromotionData | null>(null);

  /* ---------------- Date Formatter ---------------- */
  const formatDateForInput = useCallback((dateInput: string | Date) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
  }, []);

  /* ---------------- Handlers ---------------- */
  const openConfirm = handleSubmit((data) => {
    setPendingData(data); // Capture les données actuelles du formulaire
    setDialogOpen(true);
    setDialogStatus("idle");
    setDialogResult(null);
  });

  const closeDialog = () => {
    if (dialogStatus === "loading") return;
    setDialogOpen(false);
    setTimeout(() => {
      setPendingData(null);
      setDialogStatus("idle");
    }, 200);
  };

  const confirmSubmit = async () => {
    if (!pendingData) return;

    setDialogStatus("loading");

    try {
      if (isEdit) {
        // TypeScript accepte ici car pendingData match PlanPayloadUpdate (Partial)
        await promosApi.update(id!, pendingData as PromotionPayloadUpdate, accessToken);
      } else {
        // En création, on cast vers le type complet
        await promosApi.create(pendingData as PromotionPayload, accessToken);
      }

      toast.success({
        title: isEdit ? "Promotion modifiée" : "Promotion créée",
        description: "L'opération a été effectuée avec succès.",
      });

      setDialogStatus("success");
      setDialogResult("Enregistrement réussi.");
      
      if (!isEdit) reset();
      setTimeout(closeDialog, 1000);
    } catch (err) {
      const friendly = formatApiError(err);
      setDialogStatus("error");
      setDialogResult(friendly.message);
      toast.error({ title: "Erreur", description: friendly.message });
    }
  };

  /* ---------------- Prefill Logic ---------------- */
  useEffect(() => {
    if (!isEdit ) return;

    let isMounted = true;

    promosApi
      .getById(id!, accessToken)
      .then((data) => {
        
        reset({
          name: data.name,
          startDate: formatDateForInput(data.startDate),
          endDate: formatDateForInput(data.endDate),
          description: data.description ?? "",
          isActive: data.isActive ?? true,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error({ title: "Erreur", description: "Impossible de charger la promotion." });
      });

    return () => { isMounted = false; };
  }, [id, isEdit, accessToken, reset, formatDateForInput,toast]);

  return {
    isEdit,
    control,
    errors,
    isSubmitting,
    openConfirm,
    confirmSubmit,
    closeDialog,
    dialogOpen,
    dialogStatus,
    dialogResult,
    pendingData,
    reset
  };
}