'use client';

import Header from "@/ui/components/header";
import Link from "next/link";
import { useMemo } from "react";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: "actif" | "suspendu";
  role: "admin" | "moderateur" | "abonné";
  avatar: string;
  lastLogin: string;
  lastDevice: string;
  subscription: {
    plan: string;
    renewal: string;
    paymentMethod: string;
    invoicesDue: number;
  };
  activity: { label: string; at: string }[];
  sessions: { device: string; location: string; at: string; ip: string }[];
  issues: { label: string; status: "ouvert" | "résolu"; at: string }[];
};

const placeholderAvatar = "/gildas.png";

const userSample: UserDetail = {
  id: "1",
  name: "Jean Dupont",
  email: "jean.dupont@example.com",
  phone: "+22961234567",
  country: "France",
  status: "actif",
  role: "abonné",
  avatar: placeholderAvatar,
  lastLogin: "Aujourd'hui, 10:12 - Paris, Chrome",
  lastDevice: "Desktop · macOS · Chrome 121",
  subscription: {
    plan: "Premium - Abonnement",
    renewal: "Renouvelle le 30/06/2025",
    paymentMethod: "Visa •••• 4242",
    invoicesDue: 0,
  },
  activity: [
    { label: "A commencé la série « Horizon Nord » - Épisode 3", at: "Il y a 25 min" },
    { label: "Changement de mot de passe", at: "Hier, 18:40" },
    { label: "Connexion depuis un nouvel appareil", at: "Hier, 09:15" },
    { label: "Renouvellement abonnement réussi", at: "28 Mai" },
  ],
  sessions: [
    { device: "MacBook · Chrome", location: "Paris, FR", at: "Actif", ip: "192.168.0.10" },
    { device: "iPhone 14 · Safari", location: "Paris, FR", at: "Hier", ip: "10.0.0.8" },
  ],
  issues: [
    { label: "Lecture bloquée sur épisode 5", status: "résolu", at: "15 Mai" },
    { label: "Question facturation", status: "ouvert", at: "3 Juin" },
  ],
};

export default function Page() {
  const user = useMemo(() => userSample, []);

  return (
    <div className="space-y-5">
      <Header title="Détail utilisateur" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span>ID :</span>
            <span className="badge badge-outline border-primary/50 text-primary">{user.id}</span>
          </div>
          <span className="w-[1px] h-4 bg-base-300" />
          <span>Dernière connexion : {user.lastLogin}</span>
        </div>
      </Header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-neutral rounded-2xl border border-base-300 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="mask mask-squircle w-16 h-16">
                <img src={user.avatar} alt={user.name} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{user.name}</h2>
              <p className="text-white/70">{user.email}</p>
              <p className="text-white/50 text-sm">{user.phone} · {user.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${user.status === "actif" ? "badge-success" : "badge-error"}`}>{user.status}</span>
            <span className="badge badge-outline border-primary/50 text-primary">{user.role}</span>
          </div>
          <div className="space-y-1 text-sm text-white/70">
            <p>Dernier device : {user.lastDevice}</p>
            <p>Connexion : {user.lastLogin}</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn btn-primary btn-sm rounded-full">Réinitialiser le mot de passe</button>
            <button className="btn btn-ghost btn-sm text-white border-base-300">Suspendre</button>
          </div>
        </div>

        <div className="col-span-8 grid grid-cols-2 gap-3">
          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
            <p className="text-xs uppercase text-white/50">Abonnement</p>
            <h3 className="text-lg font-semibold text-white">{user.subscription.plan}</h3>
            <p className="text-white/70">{user.subscription.renewal}</p>
            <p className="text-white/60 text-sm">Paiement : {user.subscription.paymentMethod}</p>
            {user.subscription.invoicesDue > 0 && (
              <p className="text-warning text-sm">Factures impayées : {user.subscription.invoicesDue}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button className="btn btn-ghost btn-xs text-primary border border-primary/50 rounded-full">Voir factures</button>
              <button className="btn btn-ghost btn-xs text-white border-base-300 rounded-full">Changer de plan</button>
            </div>
          </div>

          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
            <p className="text-xs uppercase text-white/50">Sécurité</p>
            <p className="text-white/70">MFA : activée</p>
            <p className="text-white/70">Sessions actives : {user.sessions.length}</p>
            <p className="text-white/60 text-sm">Dernière alerte : aucune</p>
            <div className="flex gap-2 pt-2">
              <button className="btn btn-ghost btn-xs text-white border-base-300 rounded-full">Révoquer les sessions</button>
              <button className="btn btn-ghost btn-xs text-primary border border-primary/50 rounded-full">Forcer reconnexion</button>
            </div>
          </div>

          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-3 col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-white/50">Activité récente</p>
                <h3 className="text-lg font-semibold text-white">Actions</h3>
              </div>
              <Link href="/dashboard/users" className="btn btn-ghost btn-xs text-primary border-primary/50 rounded-full">
                Retour liste
              </Link>
            </div>
            <ul className="space-y-2 text-sm text-white/80">
              {user.activity.map((act, idx) => (
                <li key={idx} className="flex items-center justify-between bg-base-200/30 border border-base-300 rounded-lg px-3 py-2">
                  <span className="flex-1">{act.label}</span>
                  <span className="text-xs text-white/50">{act.at}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
            <p className="text-xs uppercase text-white/50">Sessions</p>
            <div className="space-y-2 text-sm text-white/80">
              {user.sessions.map((s, idx) => (
                <div key={idx} className="border border-base-300 rounded-lg px-3 py-2">
                  <p className="font-semibold">{s.device}</p>
                  <p className="text-white/60">{s.location} · {s.at}</p>
                  <p className="text-white/50 text-xs">IP {s.ip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
            <p className="text-xs uppercase text-white/50">Tickets / issues</p>
            <div className="space-y-2 text-sm text-white/80">
              {user.issues.map((issue, idx) => (
                <div key={idx} className="border border-base-300 rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{issue.label}</p>
                    <p className="text-white/60 text-xs">{issue.at}</p>
                  </div>
                  <span className={`badge ${issue.status === "résolu" ? "badge-success" : "badge-warning"} badge-sm`}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
