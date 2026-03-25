'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import Sidebar from "@/ui/layout/sidebar";
import { BellDot, Lightbulb, Menu, SettingsIcon, X } from "lucide-react";
import Image from "next/image";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function DashboardLayoutClient({ children, session }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  // 🔐 Auto-redirect si non connecté
  useEffect(() => {
    if (!session) {
      router.replace("/api/auth/signin/keycloak?callbackUrl=/");
    }
  }, [session, router]);

  // ⚠️ tant que la session n'est pas chargée, on peut afficher loader
  if (!session) return <div>Chargement...</div>;

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
                src="/gildas.png"
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border border-base-300"
              />
              <span className="text-white font-semibold">Gildas</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="mt-4 min-w-0">{children}</div>
      </main>
    </div>
  );
}