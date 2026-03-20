import { useState } from "react";
import { DialogStatus } from "@/ui/components/confirmationDialog";

type UseDeleteOptions<T> = {
  entityName: string;
  getLabel: (item: T) => string;
  deleteFn: (id: string) => Promise<void>;
  onDeleted?: (id: string) => void;
};

export function useDeleteWithConfirmation<T extends { id: string }>(
  options: UseDeleteOptions<T>
) {
  const { entityName, getLabel, deleteFn, onDeleted } = options;

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DialogStatus>("idle");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [item, setItem] = useState<T | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const openDialog = (item: T) => {
    setItem(item);
    setConfirmText("");
    setStatus("idle");
    setResultMessage(null);
    setOpen(true);
  };

  const closeDialog = () => {
    if (status === "loading") return;
    setOpen(false);
    setItem(null);
    setConfirmText("");
  };

  const confirmDelete = async () => {
    if (!item) return;

    if (confirmText !== "SUPPRIMER") {
      setStatus("error");
      setResultMessage("Veuillez taper exactement SUPPRIMER pour confirmer.");
      return;
    }

    setStatus("loading");

    try {
      await deleteFn(item.id);

      onDeleted?.(item.id);

      setStatus("success");
      setResultMessage(
        `${entityName} "${getLabel(item)}" supprimé définitivement.`
      );

      setTimeout(closeDialog, 800);
    } catch (err: unknown) {
      setStatus("error");
      setResultMessage(
        (err instanceof Error ? err.message : null) ?? "Une erreur est survenue lors de la suppression."
      );
    }
  };

  const dialogMessage = item
    ? `⚠️ ACTION IRRÉVERSIBLE

Vous êtes sur le point de supprimer définitivement ${entityName} :

"${getLabel(item)}"

Cette action :
• supprime toutes les données associées
• révoque tous les accès
• ne peut pas être annulée`
    : "";

  return {
    // état
    open,
    status,
    resultMessage,
    confirmText,
    setConfirmText,

    // contenu
    dialogMessage,

    // actions
    openDialog,
    closeDialog,
    confirmDelete,
  };
}
