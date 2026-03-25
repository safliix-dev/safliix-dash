// components/ui/auth-status-card.tsx
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import Link from "next/link";

interface AuthStatusCardProps {
  type: "loading" | "redirecting" | "error" | "unauthorized";
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function AuthStatusCard({ type, title, message, onRetry }: AuthStatusCardProps) {
  const config = {
    loading: {
      icon: <Loader2 className="h-12 w-12 animate-spin text-blue-500" />,
      defaultTitle: "Vérification de votre session",
      defaultMessage: "Nous vérifions vos informations d'authentification...",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
    },
    redirecting: {
      icon: <Loader2 className="h-12 w-12 animate-spin text-purple-500" />,
      defaultTitle: "Redirection en cours",
      defaultMessage: "Vous allez être redirigé vers le portail d'authentification...",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
    },
    error: {
      icon: <AlertCircle className="h-12 w-12 text-red-500" />,
      defaultTitle: "Erreur d'authentification",
      defaultMessage: "Une erreur est survenue lors de l'authentification.",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100",
    },
    unauthorized: {
      icon: <AlertCircle className="h-12 w-12 text-orange-500" />,
      defaultTitle: "Accès non autorisé",
      defaultMessage: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
    },
  };

  const current = config[type];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={`${current.bgColor} rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 transition-all duration-300 animate-fade-in`}>
        <div className="flex flex-col items-center text-center">
          <div className={`${current.iconBg} rounded-full p-4 mb-6`}>
            {current.icon}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {title || current.defaultTitle}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {message || current.defaultMessage}
          </p>
          
          {type === "error" && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              <LogIn className="h-4 w-4" />
              Réessayer
            </button>
          )}
          
          {type === "unauthorized" && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Retour à l&apos;accueil
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}