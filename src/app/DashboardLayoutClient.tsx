'use client';

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Sidebar from "@/ui/layout/sidebar";
import { BellDot, Lightbulb, Menu, SettingsIcon, X, LogOut, LogIn } from "lucide-react";
import Image from "next/image";

// Providers
import { SocketProvider } from '@/lib/contexts/SocketContext';
import { JobProvider } from '@/lib/contexts/JobContext';
// Components
import { ActivityCenter } from "@/ui/components/activityCenter";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

function SplashScreen({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/ICONE_SFLIX.png"
          alt="SAFLIIX"
          width={72}
          height={72}
          className="animate-pulse"
          priority
        />
        <span className="text-white text-xl font-semibold tracking-[0.3em]">SAFLIIX</span>
        <p className="text-white/40 text-sm animate-pulse">{text}</p>
      </div>
    </div>
  );
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { data: session, status } = useSession();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log("SESSION STATUS:", status);
    console.log("SESSION DATA:", session);
  }, [status, session]);

  if (!isClient) {
    return <SplashScreen text="Chargement..." />;
  }

  if (status === "loading") {
    return <SplashScreen text="Vérification de votre session..." />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/ICONE_SFLIX.png"
            alt="SAFLIIX"
            width={72}
            height={72}
            priority
          />
          <span className="text-white text-xl font-semibold tracking-[0.3em]">SAFLIIX</span>
          <div className="w-12 h-px bg-white/10" />
          <p className="text-white/50 text-sm">Accès réservé aux administrateurs</p>
          <button
            onClick={() => signIn("keycloak", { callbackUrl: "/" })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors duration-200"
          >
            <LogIn className="w-4 h-4" />
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <SplashScreen text="Initialisation de votre session..." />;
  }

  return (
    <SocketProvider>
      <JobProvider>
        <div className="min-h-screen bg-black">
          <div className={`transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-0"}`}>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-black border-r border-white/10 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
              <Sidebar />
            </aside>

            {/* Main */}
            <main className="h-screen flex flex-col">

              {/* Topbar */}
              <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center justify-between px-6 py-4">

                  {/* Left */}
                  <div className="flex items-center gap-4">
                    <button
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      onClick={() => setSidebarOpen(prev => !prev)}
                    >
                      {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <Image
                        src="/ICONE_SFLIX.png"
                        alt="SAFLIIX"
                        width={24}
                        height={24}
                      />
                      <span className="text-white font-semibold tracking-[0.2em] text-sm">SAFLIIX</span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">
                    <ActivityCenter />
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                      <Lightbulb className="w-5 h-5" />
                    </button>

                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors relative">
                      <BellDot className="w-5 h-5" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </button>

                    {/* User menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
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
                          <p className="text-xs text-white/40">{session.user?.email}</p>
                        </div>
                      </button>

                      {showUserMenu && (
                        <>
                          <div
                            className="fixed inset-0"
                            onClick={() => setShowUserMenu(false)}
                          />

                          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 rounded-lg border border-white/10 z-20">
                            <div className="p-3 border-b border-white/10">
                              <p className="text-sm text-white">{session.user?.name}</p>
                              <p className="text-xs text-white/40">{session.user?.email}</p>
                            </div>

                            <div className="p-2">
                              <button className="w-full text-left px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <SettingsIcon className="inline w-4 h-4 mr-2" />
                                Paramètres
                              </button>

                              <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full text-left px-3 py-2 text-sm text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
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
              <div className="p-6 flex-1 overflow-y-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </JobProvider>
    </SocketProvider>
  );
}