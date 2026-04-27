// app/dashboard/ads/add/useadsForm.ts

'use client';

import { useEffect, useMemo } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { AdsAdapter } from "./adsAdapter";
import { useSession } from "next-auth/react";
import { AdsFormData, AdsSlot, AdsMetadataPayload } from "@/types/api/ads";
import { PresignedSlot } from "@/types/upload";

interface UseadsFormProps {
  adsId?: string;
}

export interface AdsPresignedSlot extends PresignedSlot<AdsSlot> {
  // Propriétés héritées de PresignedSlot :
  // key: AdsSlot;          (ex: 'mainImage')
  // uploadUrl: string;     (L'URL signée S3)
  
  // Propriété spécifique à ton backend pour l'enregistrement final :
  mediaFileId: string;      // L'ID créé en base pour ce fichier précis
}

export function useAdsForm({ adsId }: UseadsFormProps = {}) {
  const { data: session } = useSession();
  const  = session?.;

  // 1. On définit les valeurs par défaut proprement
  const defaultValues: AdsFormData = {
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    line: "1",
    status: "Brouillon",
    mainImage: null,
    secondaryImage: null,
  };

  // 2. Configuration du moteur avec typage EXPLICITE
  // On passe <TForm, TMeta, TSlot, TPresigned>
  const engine = useMediaFormEngine<AdsFormData, AdsMetadataPayload, AdsSlot, AdsPresignedSlot>(
    AdsAdapter, 
    defaultValues
  );

  // 3. Gestion de l'ID pour l'édition
  useEffect(() => {
    if (adsId && !engine.entityId) {
      engine.setEntityId(adsId);
    }
  }, [adsId, engine.entityId, engine.setEntityId,engine]); // Retiré 'engine' du tableau pour éviter des boucles inutiles

  // 4. Objet meta (utilisez useMemo pour éviter de recréer l'objet à chaque rendu)
  const meta = useMemo(() => ({
    loading: false,
    error: null,
    options: null,
    refresh: async () => {},
  }), []);

  return {
    ...engine,
    meta,
    ,
  };
}