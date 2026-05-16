// lib/hooks/useContentAction.ts
import { useState } from "react";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { uploadApi } from "../api/uploads";
import { formatApiError } from "@/lib/api/errors";
import type { ContentAction } from "@/types/api/common";
import type { ContentType } from "./useBaseContentManagement";

interface UseContentActionParams {
  contentType: ContentType;
  onSuccess?: () => void;
}

export function useContentAction({ contentType, onSuccess }: UseContentActionParams) {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    message: "",
    action: null as ContentAction | null,
    contentId: null as string | null,
    status: "idle" as "idle" | "loading" | "success" | "error",
    resultMessage: null as string | null,
  });

  const toast = useToast();

  const openConfirmation = (contentId: string, action: ContentAction) => {
    const config = {
      publish: {
        title: "Publier le contenu",
        message: "Voulez-vous publier ce contenu ? Il sera visible par tous.",
      },
      archive: {
        title: "Archiver le contenu",
        message: "Voulez-vous archiver ce contenu ? Il ne sera plus visible.",
      },
      restore: {
        title: "Restaurer le contenu",
        message: "Voulez-vous restaurer ce contenu ? Il sera à nouveau visible.",
      },
    };

    const { title, message } = config[action];

    setDialogState({
      open: true,
      title,
      message,
      action,
      contentId,
      status: "idle",
      resultMessage: null,
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, open: false }));
  };

  const executeAction = async () => {
    if (!dialogState.contentId || !dialogState.action) return;

    setDialogState(prev => ({ ...prev, status: "loading", resultMessage: null }));

    try {
      // Appel API à définir selon ton backend
      const statusMap: Record<ContentAction, string> = {
        publish: "PUBLISHED",
        archive: "ARCHIVED",
        restore: "DRAFT",
      };

      const response = await uploadApi.changeStatus(
        dialogState.contentId,
        contentType,
        statusMap[dialogState.action]
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'action");
      }

      setDialogState(prev => ({
        ...prev,
        status: "success",
        resultMessage: "Action effectuée avec succès",
      }));

      toast.success({
        title: "Succès",
        description: "L'action a été effectuée avec succès",
      });

      // Fermer automatiquement après 2 secondes et rafraîchir
      setTimeout(() => {
        closeDialog();
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (error) {
      const friendly = formatApiError(error);
      setDialogState(prev => ({
        ...prev,
        status: "error",
        resultMessage: friendly.message,
      }));
      
      toast.error({
        title: "Erreur",
        description: friendly.message,
      });
    }
  };

  return {
    dialogState,
    openConfirmation,
    closeDialog,
    executeAction,
  };
}