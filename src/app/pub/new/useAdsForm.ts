// app/dashboard/ads/add/useadsForm.ts

'use client';

import { useEffect } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { AdsAdapter } from "./adsAdapter";
import { useSession } from "next-auth/react";
import { AdsFormData } from "@/types/api/ads";

interface UseadsFormProps {
  adsId?: string;
}

export function useAdsForm({ adsId }: UseadsFormProps = {}) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  // 1. Configuration du moteur (Engine) - Pas de meta options
  const engine = useMediaFormEngine(
    AdsAdapter, 
    {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      line: "1",
      status: "Brouillon",
      mainImage: null,
      secondaryImage: null,
    } as AdsFormData
  );

  // 2. Gestion de l'ID pour l'édition
  useEffect(() => {
    if (adsId && !engine.entityId) {
      engine.setEntityId(adsId);
    }
  }, [adsId, engine.entityId, engine.setEntityId,engine]);

  // 3. Créer un objet meta vide (ou avec des options statiques)
  const meta = {
    loading: false,
    error: null,
    options: null,
    refresh: async () => {},
  };

  return {
    ...engine,
    meta,
    accessToken,
  };
}