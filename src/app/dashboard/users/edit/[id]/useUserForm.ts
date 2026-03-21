'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import type { DialogStatus } from "@/ui/components/confirmationDialog";
import { UserPayload} from "@/types/api/users";
import { usersApi } from "@/lib/api/users";

export function useUserForm(id?: string) {
  const isEdit = !!id && id !== "new";
  const toast = useToast();
  const accessToken = useAccessToken();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UserPayload>({
    defaultValues: {
      email: "",
      firstName: "",
      lastName:"",
      role:"user",
      avatarUrl: "",
      password: "",
    },
  });

  /* ---------------- confirmation dialog ---------------- */

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");
  const [dialogResult, setDialogResult] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<UserPayload | null>(null);

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
      if (isEdit) {
        await usersApi.update(id,pendingData,accessToken);
      } else {
        await usersApi.create(pendingData,accessToken);
      }

      toast.success({
        title: isEdit ? "Utilisateur modifié" : "Utilisateur créé",
        description: "Opération effectuée avec succès.",
      });

      setDialogStatus("success");
      setDialogResult("Opération réussie.");
      reset();
      setTimeout(closeDialog, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setDialogStatus("error");
      setDialogResult(message);
      toast.error({ title: "Utilisateur", description: message });
    }
  };

  /* ---------------- pré-remplissage édition ---------------- */

  useEffect(() => {
    if (!isEdit) return;

    usersApi.detail(id,accessToken)
      .then((data) => {
          reset({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          status:data.status,
          avatarUrl: data.avatar,
        });
      })
      .catch(() => {
        toast.error({
          title: "Chargement",
          description: "Impossible de charger l'utilisateur.",
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    isEdit,
    control,
    isSubmitting,

    openConfirm,
    confirmSubmit,
    closeDialog,

    dialogOpen,
    dialogStatus,
    dialogResult,
    pendingData,
  };
}
