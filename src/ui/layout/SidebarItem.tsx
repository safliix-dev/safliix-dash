import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SidebarItemProps {
  href: string;
  children: React.ReactNode;
  icon: React.ElementType;
  imageSrc?: string;
  pathname: string;
  submenus?: { href: string; label: string; icon: React.ElementType }[];
}

const SidebarItem = ({
  href,
  children,
  icon: Icon,
  imageSrc,
  pathname,
  submenus = [],
}: SidebarItemProps) => {
  const hasSubmenus = submenus.length > 0;

  // Déterminer si l'élément (ou un de ses sous-menus) est actif
  const isActive = (() => {
    if (hasSubmenus) {
      return submenus.some(
        (sub) => pathname === sub.href || pathname.startsWith(sub.href)
      );
    }
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  })();

  // Styles communs pour éviter la répétition
  const commonClasses = `group relative flex items-center gap-3 rounded-lg px-4 py-2 transition-colors w-full text-left ${
    isActive ? "bg-primary/10 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
  }`;

  // Contenu partagé (Barre latérale + Icône + Texte)
  const ItemContent = (
    <>
      <span
        className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary transition-opacity duration-200 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        }`}
      />
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={typeof children === "string" ? children : "sidebar icon"}
          width={20}
          height={20}
          className="w-5 h-5 object-contain"
        />
      ) : (
        Icon && <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-white/60"}`} />
      )}
      <span className="truncate font-medium">{children}</span>
    </>
  );

  return (
    <li className="list-none">
      {/* Rendu conditionnel pour satisfaire TypeScript et Next.js Link */}
      {hasSubmenus ? (
        <div className={commonClasses}>
          {ItemContent}
        </div>
      ) : (
        <Link href={href} className={commonClasses}>
          {ItemContent}
        </Link>
      )}

      {/* Liste des sous-menus */}
      {hasSubmenus && (
        <ul className="ml-7 mt-1 space-y-1 border-l border-white/10 pl-3">
          {submenus.map((submenu, idx) => {
            const SubIcon = submenu.icon;
            const isSubActive = pathname === submenu.href || pathname.startsWith(submenu.href);
            
            return (
              <li key={`${submenu.href}-${idx}`}>
                <Link
                  href={submenu.href}
                  className={`flex items-center gap-2 py-1.5 text-sm transition-colors ${
                    isSubActive ? "text-primary" : "text-white/60 hover:text-white"
                  }`}
                >
                  <SubIcon className="w-4 h-4" />
                  <span className="truncate">{submenu.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

export default SidebarItem;