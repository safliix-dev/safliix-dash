'use client';

import Header from "@/ui/components/header";
import Link from "next/link";

type FilmDetail = {
  id: string;
  title: string;
  status: "Actif" | "Brouillon" | "Suspendu";
  category: string;
  director: string;
  dp: string;
  duration: string;
  releaseDate: string;
  publishDate: string;
  price: string;
  poster: string;
  hero: string;
  synopsis: string;
  stats: {
    vues: number;
    revenus: string;
    abonnements?: number;
    locations?: number;
  };
  activity: { label: string; at: string }[];
  geo: { label: string; value: number; max: number; color: string }[];
};

const filmSample: FilmDetail = {
  id: "1",
  title: "Au fil du temps",
  status: "Actif",
  category: "Documentaire",
  director: "SFLIX",
  dp: "Gildas",
  duration: "1h42",
  releaseDate: "2024-05-10",
  publishDate: "2024-06-02",
  price: "2 500 F",
  poster: "/elegbara.png",
  hero: "/elegbara.png",
  synopsis:
    "Un voyage à travers les saisons, suivant le parcours d'un village qui se réinvente face aux défis modernes.",
  stats: {
    vues: 23400,
    revenus: "1.2M F",
    locations: 5600,
    abonnements: 1200,
  },
  activity: [
    { label: "Ajouté au catalogue", at: "02/06/2024" },
    { label: "Mise à jour de la jaquette", at: "12/07/2024" },
    { label: "Encodage terminé", at: "01/06/2024" },
    { label: "Sous-titres FR ajoutés", at: "05/06/2024" },
  ],
  geo: [
    { label: "France", value: 5000, max: 10000, color: "progress-primary" },
    { label: "Togo", value: 7000, max: 10000, color: "progress-error" },
    { label: "Bénin", value: 10000, max: 10000, color: "progress-success" },
    { label: "Sénégal", value: 1000, max: 10000, color: "progress-warning" },
  ],
};

export default function Page({ params: _params }: { params: { id: string } }) {
  const film = filmSample;

  return (
    <div className="space-y-5">
      <Header title="Détail film" className="rounded-2xl border border-base-300 shadow-sm px-5">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span className="badge badge-outline border-primary/50 text-primary">ID {film.id}</span>
          <span className="w-[1px] h-4 bg-base-300" />
          <span>Statut : {film.status}</span>
        </div>
      </Header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-neutral rounded-2xl border border-base-300 p-4 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <img src={film.poster} alt={film.title} className="w-48 h-64 object-cover rounded-xl border border-base-300" />
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold text-white">{film.title}</h2>
              <p className="text-white/60 text-sm">{film.category}</p>
              <span className={`badge ${film.status === "Actif" ? "badge-success" : "badge-warning"}`}>{film.status}</span>
            </div>
          </div>
          <div className="space-y-1 text-sm text-white/70">
            <p>Réalisateur : {film.director}</p>
            <p>DP : {film.dp}</p>
            <p>Durée : {film.duration}</p>
            <p>Sortie : {film.releaseDate}</p>
            <p>Publication SaFLIX : {film.publishDate}</p>
            <p>Prix location : {film.price}</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn btn-primary btn-sm rounded-full">Publier</button>
            <button className="btn btn-ghost btn-sm text-white border-base-300 rounded-full">Mettre en pause</button>
          </div>
        </div>

        <div className="col-span-8 space-y-4">
          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Synopsis</h3>
              <Link href="/dashboard/films" className="btn btn-ghost btn-xs text-primary border-primary/50 rounded-full">
                Retour liste
              </Link>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{film.synopsis}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-1">
              <p className="text-xs uppercase text-white/50">Vues</p>
              <p className="text-2xl font-semibold text-primary">{film.stats.vues.toLocaleString()}</p>
              <p className="text-white/60 text-sm">Depuis publication</p>
            </div>
            <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-1">
              <p className="text-xs uppercase text-white/50">Revenus</p>
              <p className="text-2xl font-semibold text-primary">{film.stats.revenus}</p>
              <p className="text-white/60 text-sm">Cumulés</p>
            </div>
            <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-1">
              <p className="text-xs uppercase text-white/50">Locations / Abonnements</p>
              <p className="text-lg font-semibold text-primary">
                {film.stats.locations?.toLocaleString()} loc · {film.stats.abonnements?.toLocaleString()} abo
              </p>
              <p className="text-white/60 text-sm">30 derniers jours</p>
            </div>
          </div>

          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-3">
            <h3 className="text-lg font-semibold text-white">Répartition géographique</h3>
            <div className="grid grid-cols-2 gap-3">
              {film.geo.map((g) => (
                <div key={g.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{g.label}</span>
                    <span>{g.value.toLocaleString()} f</span>
                  </div>
                  <progress className={`progress w-full ${g.color}`} value={g.value} max={g.max}></progress>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral rounded-2xl border border-base-300 p-4 space-y-2">
            <h3 className="text-lg font-semibold text-white">Activité du titre</h3>
            <ul className="space-y-2 text-sm text-white/80">
              {film.activity.map((a, idx) => (
                <li key={idx} className="flex items-center justify-between bg-base-200/30 border border-base-300 rounded-lg px-3 py-2">
                  <span>{a.label}</span>
                  <span className="text-xs text-white/50">{a.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
