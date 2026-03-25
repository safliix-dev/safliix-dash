// app/auth/error/page.tsx
'use client';

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthStatusCard } from "@/ui/components/authStatusCard";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  const getErrorMessage = (errorCode: string) => {
    const errors: Record<string, string> = {
      OAuthCallback: "Erreur de callback OAuth. Vérifiez la configuration Keycloak.",
      OAuthSignin: "Erreur lors de la connexion OAuth.",
      OAuthCreateAccount: "Impossible de créer le compte utilisateur.",
      EmailCreateAccount: "Impossible de créer le compte email.",
      Callback: "Erreur lors du callback d'authentification.",
      Default: "Une erreur inattendue est survenue.",
    };
    return errors[errorCode] || errors.Default;
  };

  return (
    <AuthStatusCard 
      type="error"
      title="Erreur d'authentification"
      message={getErrorMessage(error || "Default")}
      onRetry={() => signIn("keycloak", { callbackUrl: "/" })}
    />
  );
}