import { useState } from "react";
import { seriesApi } from "@/lib/api/series";
import { formatApiError } from "@/lib/api/errors";
import { uploadToPresignedUrl } from "@/lib/api/uploads";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { type UploadFileDescriptor as EpisodeUploadDescriptor } from "@/types/attachmentType";
import { useEpisodeFormSteps } from "./useEpisodeFormSteps";

export type EpisodeForm = {
  title: string;
  description: string;
  isCustomProduction: boolean;
  status: string;
  duration: number | null;
  releaseDate: string;
  plateformDate: string;
  director: string;
  episodeNumber: number | null;
  actors: string;
};

type EpisodeFiles = {
  poster?: File;
  video?: File;
  subtitle?: File;
};

const statusOptions = ["DRAFT", "PUBLISHED"] as const;

export function useEpisodeForm(seriesId?: string, seasonId?: string) {
  const [form, setForm] = useState<EpisodeForm>({
    title: "",
    description: "",
    isCustomProduction: true,
    status: statusOptions[0],
    duration: null,
    releaseDate: "",
    plateformDate: "",
    director: "",
    episodeNumber: null,
    actors: "",
  });
  const [files, setFiles] = useState<EpisodeFiles>({});
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [metaSaved, setMetaSaved] = useState(false);
  const [dialogMode, setDialogMode] = useState<"meta" | "files">("meta");

  const steps = useEpisodeFormSteps();
  const toast = useToast();
  const accessToken = useAccessToken();

  const updateField = <K extends keyof EpisodeForm>(key: K, value: EpisodeForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateFile = (key: keyof EpisodeFiles, file?: File) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const buildMetadataPayload = () => ({
    title: form.title,
    description: form.description,
    isCustomProduction: form.isCustomProduction,
    status: form.status,
    duration: form.duration ?? 0,
    releaseDate: form.releaseDate,
    plateformDate: form.plateformDate,
    director: form.director,
    episodeNumber: form.episodeNumber ?? 0,
  });

  type UploadWithFile = EpisodeUploadDescriptor & { file: File };

  const collectFiles = (): UploadWithFile[] => {
    const bucket: UploadWithFile[] = [];
    if (files.poster)
      bucket.push({
        key: "poster",
        file: files.poster,
        name: files.poster.name,
        type: files.poster.type || "application/octet-stream",
        attachmentType: "POSTER",
      });
    if (files.video)
      bucket.push({
        key: "video",
        file: files.video,
        name: files.video.name,
        type: files.video.type || "application/octet-stream",
        attachmentType: "MAIN",
      });
    if (files.subtitle)
      bucket.push({
        key: "subtitle",
        file: files.subtitle,
        name: files.subtitle.name,
        type: files.subtitle.type || "application/octet-stream",
        attachmentType: "BONUS",
      });
    return bucket;
  };

  const saveMeta = async (status: "DRAFT" | "PUBLISHED") => {
    if (!seasonId) {
      steps.setResult(false, "Aucune saison cible.");
      toast.error({ title: "Episode", description: "Aucune saison cible." });
      return;
    }
    steps.setLoading();
    try {
      const meta = { ...buildMetadataPayload(), status };
      const { id } = await seriesApi.createEpisode(seriesId ?? "", seasonId, meta, accessToken);
      setEpisodeId(id);
      setMetaSaved(true);
      steps.setResult(true, "Métadonnées enregistrées. Ajoutez les fichiers si besoin.");
      toast.success({ title: "Episode", description: "Métadonnées enregistrées." });
      setDialogMode("files");
    } catch (error) {
      const friendly = formatApiError(error);
      steps.setResult(false, friendly.message);
      toast.error({ title: "Episode", description: friendly.message });
    } finally {
      steps.setLoading(false);
    }
  };

  const submitFilesOnly = async (action: "draft" | "publish") => {
    if (!episodeId) {
      steps.setResult(false, "Enregistrez d'abord les métadonnées.");
      toast.error({ title: "Episode", description: "Enregistrez d'abord les métadonnées." });
      return;
    }
    const uploadables = collectFiles();
    steps.setLoading();
    try {
      if (uploadables.length) {
        const slots = await seriesApi.presignEpisodeUploads(
          episodeId,
          uploadables.map((f) => ({
            key: f.key,
            name: f.name,
            type: f.type,
            attachmentType: f.attachmentType,
          })),
          accessToken,
        );

        for (const slot of slots) {
          const file = uploadables.find((f) => f.key === slot.key)?.file;
          if (file) {
            await uploadToPresignedUrl(slot.uploadUrl, file);
          }
        }

        await seriesApi.finalizeEpisodeUploads(
          episodeId,
          slots.map((s) => ({ key: s.key, finalUrl: s.finalUrl })),
          accessToken,
        );
      }
      steps.setResult(true, action === "publish" ? "Fichiers envoyés, épisode publié." : "Fichiers envoyés.");
      toast.success({
        title: "Episode",
        description: uploadables.length ? "Fichiers envoyés." : "Aucun fichier à envoyer.",
      });
    } catch (error) {
      const friendly = formatApiError(error);
      steps.setResult(false, friendly.message);
      toast.error({ title: "Episode", description: friendly.message });
    } finally {
      steps.setLoading(false);
    }
  };

  return {
    form,
    files,
    updateField,
    updateFile,
    statusOptions,
    buildMetadataPayload,
    collectFiles,
    submitDraft: () => saveMeta("DRAFT"),
    submitPublish: () => saveMeta("PUBLISHED"),
    submitFilesOnly,
    metaSaved,
    episodeId,
    dialogMode,
    setDialogMode,
    ...steps,
  };
}
