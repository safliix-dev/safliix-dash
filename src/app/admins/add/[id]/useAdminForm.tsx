"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { adminsApi } from "@/lib/api/admin";
import type { AdminFormState,AdminUpdateFormState } from "@/types/api/admin";
import type { DialogStatus } from "@/ui/components/confirmationDialog";

export function useAdminForm(id?: string) {
  const toast = useToast();
  const accessToken = useAccessToken();

  const isEditMode = Boolean(id && id !== "new");

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<AdminFormState>({
    defaultValues: {
      status: "inactif",
    },
  });

  /** 🔐 Dialog state */
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogResult, setDialogResult] = useState<string | null>(null);
  const [pendingAdmin, setPendingAdmin] = useState<AdminFormState | null>(null);

  /** 👉 Charger l’admin en mode édition */
  useEffect(() => {
    if (!isEditMode || !id) return;

    (async () => {
      try {
        const admin = await adminsApi.getById(id, accessToken);
        reset({
          ...admin,
          password: "",
          confirmPassword: "",
        });
      } catch {
        toast.error({
          title: "Chargement admin",
          description: "Impossible de charger les données.",
        });
      }
    })();
  }, [id, isEditMode, accessToken, reset, toast]);

  /** 👉 Ouvrir la confirmation */
  const openConfirm = handleSubmit((data) => {
    setPendingAdmin(data);
    setDialogOpen(true);
    setDialogStatus("idle");
    setDialogResult(null);
  });

  /** ❌ Fermer */
  const closeDialog = () => {
    if (dialogStatus === "loading") return;
    setDialogOpen(false);
    setDialogStatus("idle");
    setDialogResult(null);
    setPendingAdmin(null);
  };

  /** ✅ Confirmer l’envoi */
  const confirmSubmit = async () => {
    if (!pendingAdmin) return;

    setDialogStatus("loading");

    try {
      /** 🧹 Nettoyage payload (édition) */
      const payload: AdminFormState | AdminUpdateFormState = isEditMode
      ? (Object.fromEntries(
          Object.entries(pendingAdmin).filter(
            ([, value]) => value !== "" && value !== undefined
          )
        ) as AdminUpdateFormState)
      : pendingAdmin;

      if (isEditMode && id) {
        await adminsApi.update(id, payload, accessToken);
      } else {
        await adminsApi.create(payload as AdminFormState, accessToken);
      }

      setDialogStatus("success");
      setDialogResult(
        isEditMode
          ? "L’administrateur a été modifié avec succès."
          : "Le compte administrateur a été créé avec succès."
      );

      toast.success({
        title: isEditMode ? "Admin modifié" : "Admin créé",
      });

      if (!isEditMode) reset();
      setTimeout(closeDialog, 800);
    } catch (err) {
      const friendly = formatApiError(err);
      setDialogStatus("error");
      setDialogResult(friendly.message);

      toast.error({
        title: "Erreur",
        description: friendly.message,
      });
    }
  };

  return {
    control,
    isEditMode,

    openConfirm,
    confirmSubmit,
    closeDialog,
    isSubmitting,

    dialogOpen,
    dialogStatus,
    dialogResult,
  };
}
