// hooks/useAccessToken.ts (avec cache)
'use client';

import { useSession } from "next-auth/react";
import { tokensApi } from "@/lib/api/kcToken";
import { useEffect, useState } from "react";

// Cache simple en mémoire
let cachedToken: string | undefined = undefined;
let cachedUserId: string | null = null;

export function useAccessToken() {
  const { data: session, status } = useSession();
  const [accessToken, setAccessToken] = useState<string | undefined>(cachedToken);

  useEffect(() => {
    async function fetchToken() {
      if (status === "authenticated" && session?.user?.id) {
        // Vérifier le cache
        if (cachedUserId === session.user.id && cachedToken) {
          setAccessToken(cachedToken);
          return;
        }

        const response = await tokensApi.get(session.user.id);
        if (response.exists && response.accessToken) {
          cachedToken = response.accessToken;
          cachedUserId = session.user.id;
          console.log(`✅ Token récupéré pour ${session.user.id} (cache mis à jour)`);
          setAccessToken(response.accessToken);
        }
      } else if (status === "unauthenticated") {
        cachedToken = undefined;
        cachedUserId = null;
        setAccessToken(undefined);
      }
    }

    fetchToken();
  }, [session?.user?.id, status]);

  return accessToken;
}