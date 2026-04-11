'use client';

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const { data: session, status } = useSession();

  // Hydratation safe
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔍 Debug utile (tu peux supprimer après)
  useEffect(() => {
    console.log("SESSION STATUS:", status);
    console.log("SESSION DATA:", session);
  }, [status, session]);

  // 🧱 Eviter mismatch SSR
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    );
  }

  // ⏳ Session en cours
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="lg" text="Vérification de votre session..." />
      </div>
    );
  }

  // ❌ NON AUTHENTIFIÉ (plus de redirect auto !)
  if (status === "unauthenticated") {
    return (
      <AuthStatusCard 
        type="unauthenticated"
        title="Non authentifié"
        message="Vous devez vous connecter pour accéder au dashboard."
        actionLabel="Se connecter"
        onAction={() => signIn("keycloak", { callbackUrl: "/" })}
      />
    );
  }

  // ⚠️ sécurité (rare mais clean)
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="lg" text="Initialisation de votre session..." />
      </div>
    );
  }

  // ✅ RENDU NORMAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className={`transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-0"}`}>

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar />
        </aside>

        {/* Main */}
        <main className="min-h-screen">

          {/* Topbar */}
          <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
            <div className="flex items-center justify-between px-6 py-4">

              {/* Left */}
              <div className="flex items-center gap-4">
                <button
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                  onClick={() => setSidebarOpen(prev => !prev)}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  SaFliix Dashboard
                </h1>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">

                <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Lightbulb className="w-5 h-5" />
                </button>

                <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white relative">
                  <BellDot className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                  >
                    <Image
                      width={32}
                      height={32}
                      src={session?.user?.image || "/gildas.png"}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />

                    <div className="text-left">
                      <p className="text-sm text-white">{session.user?.name}</p>
                      <p className="text-xs text-gray-400">{session.user?.email}</p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0"
                        onClick={() => setShowUserMenu(false)}
                      />

                      <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg border border-gray-700 z-20">
                        <div className="p-3 border-b border-gray-700">
                          <p className="text-sm text-white">{session.user?.name}</p>
                          <p className="text-xs text-gray-400">{session.user?.email}</p>
                        </div>

                        <div className="p-2">
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg">
                            <SettingsIcon className="inline w-4 h-4 mr-2" />
                            Paramètres
                          </button>

                          <button 
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg"
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

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}