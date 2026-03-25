// app/unauthorized/page.tsx
import { AuthStatusCard } from "@/ui/components/authStatusCard";

export default function UnauthorizedPage() {
  return (
    <AuthStatusCard 
      type="unauthorized"
      title="Accès non autorisé"
      message="Vous n'avez pas les permissions nécessaires pour accéder à cette page. Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur."
    />
  );
}