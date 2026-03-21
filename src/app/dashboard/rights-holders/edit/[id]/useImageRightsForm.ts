'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { imageRightsApi } from "@/lib/api/imageRights";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import type { DialogStatus } from "@/ui/components/confirmationDialog";
import { ImageRightsFormState } from "@/types/api/imageRights";

export function useImageRightsForm(id?: string) {
  const isEdit = !!id && id !== "new";
  const toast = useToast();
  const accessToken = useAccessToken();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ImageRightsFormState>({
    defaultValues: {
      scope: "Portrait, bande-annonce, affiches",
      sharePercentage: 0,
      status: "en attente",
    },
  });

  
  /* ---------------- confirmation dialog ---------------- */

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");
  const [dialogResult, setDialogResult] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<ImageRightsFormState | null>(null);

  const openConfirm = handleSubmit((data) => {
    setPendingData(data);
    setDialogOpen(true);
    setDialogStatus("idle");
    setDialogResult(null);
  });

  const closeDialog = () => {
    if (dialogStatus === "loading") return;
    setDialogOpen(false);
    setPendingData(null);
    setDialogStatus("idle");
  };

  /* ---------------- submit ---------------- */

  const confirmSubmit = async () => {
    if (!pendingData) return;

    setDialogStatus("loading");

    try {
      const payload = {
        ...pendingData,
        legalMentions: pendingData.legal,
        startedAt: pendingData.startDate || undefined,
        expiresAt: pendingData.endDate || undefined,
      };

      if (isEdit) {
        await imageRightsApi.update(id!, payload, accessToken);
      } else {
        await imageRightsApi.create(payload, accessToken);
      }

      toast.success({
        title: isEdit ? "Ayant droit modifié" : "Ayant droit créé",
        description: "Opération effectuée avec succès.",
      });

      setDialogStatus("success");
      setDialogResult("Opération réussie.");
      reset();
      setTimeout(closeDialog, 800);
    } catch (err) {
      const friendly = formatApiError(err);
      setDialogStatus("error");
      setDialogResult(friendly.message);
      toast.error({ title: "Ayant droit", description: friendly.message });
    }
  };

  /* ---------------- pré-remplissage édition ---------------- */

  useEffect(() => {
    if (!isEdit) return;

    imageRightsApi
      .getById(id!, accessToken)
      .then((data) => {
        reset({
          ...data,
          
        });
      })
      .catch(() => {
        toast.error({
          title: "Chargement",
          description: "Impossible de charger l'ayant droit.",
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    isEdit,
    reset,
    control,
    openConfirm,
    confirmSubmit,
    closeDialog,
    isSubmitting,

    dialogOpen,
    dialogStatus,
    dialogResult,
  };
}
