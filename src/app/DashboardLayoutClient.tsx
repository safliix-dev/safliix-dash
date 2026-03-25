'use client';

import { useState, useEffect } from "react";
//import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react"; // 👈 Ajout de signIn
import Sidebar from "@/ui/layout/sidebar";
import { BellDot, Lightbulb, Menu, SettingsIcon, X } from "lucide-react";
import Image from "next/image";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
 
  const { data: session, status } = useSession();

  // Gestion de la redirection
  useEffect(() => {
    // Éviter les redirections multiples
    if (isRedirecting) return;
    
    // Si pas de session et pas en cours de chargement
    if (status === "unauthenticated") {
      console.log("🔴 Utilisateur non authentifié, redirection vers Keycloak");
      setIsRedirecting(true);
      
      // Utiliser signIn au lieu de router.replace pour plus de fiabilité
      signIn("keycloak", { 
        callbackUrl: "/",
        redirect: true 
      }).catch(error => {
        console.error("Erreur redirection Keycloak:", error);
        setIsRedirecting(false);
      });
    }
  }, [status, isRedirecting]);

  // État de chargement
  if (status === "loading" || isRedirecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRedirecting ? "Redirection vers Keycloak..." : "Chargement de votre session..."}
          </p>
        </div>
      </div>
    );
  }

  // Si non authentifié et pas en redirection (cas d'erreur)
  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur d&apos;authentification</p>
          <button 
            onClick={() => signIn("keycloak")}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Vérifier que session existe bien
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Session introuvable, veuillez patienter...</p>
      </div>
    );
  }

  // Dashboard rendu
  return (
    <div className={`min-h-screen bg-base-100 transition-all duration-200 ${sidebarOpen ? "pl-56" : "pl-4"}`}>
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-56 p-4 pr-0 flex justify-center transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="min-h-screen overflow-x-auto py-4 px-4 transition-all duration-200">
        {/* Topbar */}
        <div className="flex items-center justify-between bg-base-100/40 border border-base-300 rounded-2xl px-5 py-3 shadow-sm">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              className="btn btn-neutral btn-sm rounded-full border-base-300"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-semibold text-white whitespace-nowrap">Dashboard</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <button className="btn btn-neutral rounded-full w-11 h-11 p-0 border border-base-300">
                <SettingsIcon className="w-5 h-5" />
              </button>
              <button className="btn btn-neutral rounded-full w-11 h-11 p-0 border border-base-300">
                <Lightbulb className="w-5 h-5" />
              </button>
              <button className="btn btn-neutral rounded-full w-11 h-11 p-0 border border-base-300">
                <BellDot className="w-5 h-5" />
              </button>
            </div>
            <div className="w-[1px] h-10 bg-base-300" />
            <div className="flex items-center gap-3">
              <Image
                width={48}
                height={48}
                src={session?.user?.image || "/gildas.png"}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border border-base-300"
              />
              <span className="text-white font-semibold">
                {session?.user?.name || "Utilisateur"}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="mt-4 min-w-0">{children}</div>
      </main>
    </div>
  );
}