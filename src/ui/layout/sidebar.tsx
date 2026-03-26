'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { keycloakLogout } from "@/lib/auth/logout";
import SidebarItem from "./SidebarItem";
import {
  BarChart2,
  Clapperboard,
  CreditCard,
  Film,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Monitor,
  UserCheck,
  Settings,
  Shield,
  Users
} from "lucide-react";

type MenuItem = {
  href: string;
  label: string;
  icon?: React.ElementType;
  imageSrc?: string;
  submenus?: { href: string; label: string; icon: React.ElementType }[];
};

const items: MenuItem[] = [
  { href: "/dashboard", label: "Sflixboard", imageSrc: "/ICONE_SFLIX.png" },
  { href: "/dashboard/films", label: "Film", icon: Film },
  { href: "/dashboard/series", label: "Série", icon: Clapperboard },
  { href: "/dashboard/users", label: "Utilisateur", icon: Users },
  { href: "/dashboard/admins",label: "Admin", icon: Users},
  { href: "/dashboard/rights-holders", label: "Ayants droit", icon: UserCheck },
  { href: "/dashboard/subscriptions", label: "Abonnement", icon: CreditCard },
  {
    href: "/dashboard/stats",
    label: "Statistique",
    submenus: [
      { href: "/dashboard/stats/films", label: "Films", icon: Film },
      { href: "/dashboard/stats/revenu", label: "Revenu", icon: Clapperboard },
      { href: "/dashboard/stats/users", label: "Utilisateurs", icon: Users },
      { href: "/dashboard/stats/pub", label: "Pub", icon: Monitor }
    ],
    icon: BarChart2
  },
  { href: "/dashboard/pub", label: "Pub", icon: Megaphone },
  { href: "/dashboard/security", label: "Sécurité", icon: Shield },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings }
];







export default function Sidebar() {
	const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 h-full bg-black text-white/80 border-r border-base-300/30 flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" className="inline-flex items-center">
          <Image src="/LOGO-SAFLIIX.svg" alt="SAFLIIX" width={140} height={36} priority />
        </Link>
      </div>

      <div className="px-5 pb-3 text-xs uppercase tracking-[0.08em] text-white/40">
        Menu
      </div>

      <nav className="px-2 flex-1">
        <ul className="flex flex-col gap-1">
          {items.map((item, index) => (
            <SidebarItem
              key={index}
              href={item.href}
              pathname={pathname}
              submenus={item.submenus || []}
              icon={item.icon || LayoutDashboard}
              imageSrc={item.imageSrc}
            >
              {item.label}
            </SidebarItem>
          ))}
        </ul>
      </nav>

      <div className="px-2 pb-4 mt-auto border-t border-base-300/30 pt-3">
        <button
          onClick={() => keycloakLogout(session?.idToken)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Deconnexion</span>
        </button>
      </div>
    </aside>
  );
}
