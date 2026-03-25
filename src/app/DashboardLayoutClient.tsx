// app/DashboardLayoutClient.tsx
'use client';

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import Sidebar from "@/ui/layout/sidebar";
import { BellDot, Lightbulb, Menu, SettingsIcon, X, LogOut } from "lucide-react";
import Image from "next/image";
import { LoadingSpinner } from "@/ui/components/loadingSpinner";
import { AuthStatusCard } from "@/ui/components/authStatusCard";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Gestion de la redirection
  useEffect(() => {
    if (isRedirecting) return;
    
    if (status === "unauthenticated" && pathname !== "/unauthorized") {
      console.log("🔴 Utilisateur non authentifié, redirection vers Keycloak");
      setIsRedirecting(true);
      
      signIn("keycloak", { 
        callbackUrl: "/",
        redirect: true 
      }).catch(error => {
        console.error("Erreur redirection Keycloak:", error);
        setIsRedirecting(false);
      });
    }
  }, [status, isRedirecting, pathname]);

  // État de chargement initial
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="lg" text="Vérification de votre session..." />
      </div>
    );
  }

  // État de redirection
  if (isRedirecting) {
    return (
      <AuthStatusCard 
        type="redirecting"
        title="Redirection vers Keycloak"
        message="Vous allez être redirigé vers le portail d'authentification sécurisé..."
      />
    );
  }

  // Non authentifié - afficher une belle page d'erreur
  if (status === "unauthenticated") {
    return (
      <AuthStatusCard 
        type="error"
        title="Session expirée"
        message="Votre session a expiré ou vous n'êtes pas connecté. Veuillez vous reconnecter."
        onRetry={() => signIn("keycloak", { callbackUrl: "/" })}
      />
    );
  }

  // Vérifier que session existe
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="lg" text="Initialisation de votre session..." />
      </div>
    );
  }

  // Dashboard rendu principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className={`transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-0"}`}>
        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="min-h-screen">
          {/* Topbar améliorée */}
          <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <button
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
                  onClick={() => setSidebarOpen(prev => !prev)}
                  aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  SaFliix Dashboard
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Boutons d'actions */}
                <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white relative">
                  <Lightbulb className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white relative">
                  <BellDot className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {/* Menu utilisateur */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="relative">
                      <Image
                        width={32}
                        height={32}
                        src={session?.user?.image || "/gildas.png"}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-600"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-gray-800"></div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">
                        {session?.user?.name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {session?.user?.email || "email@exemple.com"}
                      </p>
                    </div>
                  </button>
                  
                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20 animate-fade-in">
                        <div className="p-3 border-b border-gray-700">
                          <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                          <p className="text-xs text-gray-400">{session?.user?.email}</p>
                        </div>
                        <div className="p-2">
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                            <SettingsIcon className="inline w-4 h-4 mr-2" />
                            Paramètres
                          </button>
                          <button 
                            onClick={() => signIn("keycloak")}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                          >
                            <LogOut className="inline w-4 h-4 mr-2" />
                            Se déconnecter
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}