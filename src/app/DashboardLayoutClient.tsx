'use client';

import { useState } from "react";
import Sidebar from "@/ui/layout/sidebar";
import { BellDot, Lightbulb, Menu, SettingsIcon, X, LogOut } from "lucide-react";
import Image from "next/image";

// Providers
import { SocketProvider } from '@/lib/contexts/SocketContext';
import { JobProvider } from '@/lib/contexts/JobContext';
// Components
import { ActivityCenter } from "@/ui/components/activityCenter";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const mockSession = {
    user: {
      name: "Utilisateur Test",
      email: "test@example.com",
      image: "/gildas.png"
    }
  };

  return (
    <SocketProvider>
      <JobProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
          
          {/* Sidebar */}
          <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <Sidebar />
          </aside>

          {/* Main Wrapper */}
          <div className={`transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-0"}`}>
            
            <main className="min-h-screen flex flex-col">

              {/* Topbar */}
              <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
                <div className="flex items-center justify-between px-6 py-4">

                  {/* Left */}
                  <div className="flex items-center gap-4">
                    <button
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      onClick={() => setSidebarOpen(prev => !prev)}
                    >
                      {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hidden sm:block">
                      SaFliix Dashboard
                    </h1>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">
                    
                    {/* 🚀 LA TOUR DE CONTRÔLE GLOBALE */}
                    <ActivityCenter />

                    <div className="h-6 w-[1px] bg-gray-700 mx-1 hidden md:block"></div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
                        <Lightbulb className="w-5 h-5" />
                      </button>

                      <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700  relative text-white">
                        <BellDot className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-800"></span>
                      </button>
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700 transition-all"
                      >
                        <div className="relative w-8 h-8">
                          <Image fill src={mockSession.user.image} alt="Avatar" className="rounded-full object-cover border border-gray-600" />
                        </div>
                        <div className="text-left hidden lg:block">
                          <p className="text-xs font-bold text-white leading-none">{mockSession.user.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase">Admin</p>
                        </div>
                      </button>

                      {showUserMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                          <div className="absolute right-0 mt-3 w-60 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 bg-gray-700/30">
                              <p className="text-sm font-bold text-white">{mockSession.user.name}</p>
                              <p className="text-xs text-gray-400 truncate">{mockSession.user.email}</p>
                            </div>
                            <div className="p-2">
                              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-xl">
                                <SettingsIcon className="w-4 h-4 mr-3 text-gray-500" />
                                Paramètres
                              </button>
                              <button onClick={() => console.log("Logout")} className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl">
                                <LogOut className="w-4 h-4 mr-3" />
                                Se déconnecter
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* Page Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {children}
              </div>

            </main>
          </div>
        </div>
      </JobProvider>
    </SocketProvider>
  );
}