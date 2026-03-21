"use client";

import { useEffect, useState } from "react";
import ConfirmationDialog, { DialogStatus } from "@/ui/components/confirmationDialog";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { withRetry } from "@/lib/api/retry";
import { formatApiError } from "@/lib/api/errors";
import { seriesApi } from "@/lib/api/series";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { uploadToPresignedUrl } from "@/lib/api/uploads";

type SeasonDraft = {
  numero: number | "";
  title: string;
  description: string;
  serieId: string;
  poster: File | null;
};

export default function SeasonAddClient({ id }: { id: string }) {
  const [numero, setNumero] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serieId, setSerieId] = useState(id);
  const [poster, setPoster] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");
  const [dialogResult, setDialogResult] = useState<string | null>(null);
  const [pendingSeason, setPendingSeason] = useState<SeasonDraft | null>(null);
  const toast = useToast();
  const accessToken = useAccessToken();

  useEffect(() => {
    setSerieId(id);
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serieId) {
      toast.error({ title: "Saison", description: "Aucun identifiant de série fourni." });
      return;
    }

    const data: SeasonDraft = { numero, title, description, serieId, poster };
    setPendingSeason(data);
    setDialogOpen(true);
    setDialogStatus("idle");
    setDialogResult(null);
  };

  const closeDialog = () => {
    if (dialogStatus === "loading") return;
    setDialogOpen(false);
    setDialogStatus("idle");
    setDialogResult(null);
  };

  const confirmSend = async () => {
    if (!pendingSeason) return;

    setDialogStatus("loading");
    setDialogResult(null);

    try {
      const { seasonId } = await withRetry(
        () =>
          seriesApi.createSeason(
            pendingSeason.serieId,
            { numero: Number(pendingSeason.numero), title: pendingSeason.title, description: pendingSeason.description },
            accessToken,
          ),
        { retries: 1 },
      );

      if (pendingSeason.poster) {
        const slots = await withRetry(
          () =>
            seriesApi.presignSeasonUploads(
              pendingSeason.serieId,
              seasonId,
              [{ key: "poster", name: pendingSeason.poster!.name, type: pendingSeason.poster!.type, attachmentType: "POSTER" as const }],
              accessToken,
            ),
          { retries: 1 },
        );

        for (const slot of slots) {
          await withRetry(() => uploadToPresignedUrl(slot.uploadUrl, pendingSeason.poster!), { retries: 2 });
        }

        await seriesApi.finalizeSeasonUploads(
          pendingSeason.serieId,
          seasonId,
          slots.map((s) => ({ ...s })),
          accessToken,
        );
      }

      setDialogStatus("success");
      setDialogResult("Saison envoyée avec succès.");
      toast.success({
        title: "Saison",
        description: "Saison envoyée avec succès.",
      });
    } catch (error) {
      setDialogStatus("error");
      const friendly = formatApiError(error);
      setDialogResult(friendly.message || "Échec de l'envoi de la saison.");
      toast.error({
        title: "Saison",
        description: friendly.message || "Impossible d'envoyer la saison.",
      });
    }
  };

  return (
    <>
      <form id="season-form" onSubmit={handleSubmit} className="p-4 space-y-6 bg-neutral rounded-lg shadow-md">
        <h2 className="text-lg font-semibold">Nouvelle saison</h2>

        <div>
          <label className="block mb-1 text-sm font-medium">Numéro de saison</label>
          <input
            type="number"
            value={numero}
            onChange={(e) => setNumero(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Titre de la saison"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Description de la saison"
            rows={3}
          />
        </div>

        {!serieId && (
          <div className="alert alert-warning text-sm">
            Ajoutez un identifiant de série dans l&apos;URL pour cibler la série.
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium">Affiche (poster)</label>
          <UploadBox onFileSelect={setPoster} />
        </div>
      </form>

      <ConfirmationDialog
        open={dialogOpen}
        title="Confirmer l'envoi de la saison"
        message="Validez l'envoi de ces informations vers le back-office."
        status={dialogStatus}
        resultMessage={dialogResult}
        confirmLabel="Envoyer"
        onCancel={closeDialog}
        onConfirm={confirmSend}
      >
        {pendingSeason && (
          <div className="bg-base-100/10 border border-base-300 rounded-xl p-3 text-sm text-white/80 space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60">Numéro</span>
              <span>{pendingSeason.numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Titre</span>
              <span>{pendingSeason.title || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Description</span>
              <span>{pendingSeason.description || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Poster</span>
              <span>{pendingSeason.poster ? pendingSeason.poster.name : "Non fourni"}</span>
            </div>
          </div>
        )}
      </ConfirmationDialog>
    </>
  );
}
