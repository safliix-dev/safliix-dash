'use client';

import { useEffect, useState } from "react";
//import FilterBtn from "@/ui/components/filterBtn";
import Header from "@/ui/components/header";
import { Ligature } from "lucide-react";
import Link from "next/link";
import { statsApi } from "@/lib/api/stats";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { type PubStatsItem } from "@/types/api/stats";
import Image from "next/image";

export default function Page(){
  const [pubs, setPubs] = useState<PubStatsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await statsApi.pub(undefined, );
        if (cancelled) return;
        setPubs(res.items);
      } catch (err) {
        if (cancelled) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Stats pubs", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [, toast]);

  return (
    <div>
      <Header title="Liste et statistique de pubs"/>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2"> 
          {/* <FilterBtn title="Filtrer par statut"/>
          <FilterBtn title="Meilleures résultats"/>
          <FilterBtn title="Dernier ajout"/> */}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary">Exporter les rapports</button>
          <Link href="/dashboard/pub/new" className="btn btn-primary">
            Créer un pub
          </Link>
        </div>
      </div>
      {loading && <div className="alert alert-info text-sm mt-3">Chargement des campagnes...</div>}
      {error && <div className="alert alert-error text-sm mt-3">{error}</div>}
      <div className="mt-7 space-y-3">
        {pubs.map((pub) => (
          <PubCard key={pub.id} pub={pub}/>
        ))}
        {!loading && !error && pubs.length === 0 && (
          <div className="text-sm text-white/70">Aucune campagne trouvée.</div>
        )}
      </div>
    </div>
  )
}


type Pub = PubStatsItem & {
  geo?: { label: string; value: number; max?: number; color?: string }[];
  stats?: { conversions?: string | number; views?: string | number };
};

function PubCard({ pub } : { pub: Pub}) {
  return (
    <div className="bg-[#1e1e1e] text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-1 max-w-5xl mx-auto mb-4 relative">
      {/* Poster + Modifier */}
      <Link
        className="absolute top-2 right-2 btn btn-ghost btn-xs text-primary border-primary/50 rounded-full"
        href={`/stats/pub/detail/${pub.id}`}
      >
        Voir les détails
      </Link>
      <div className="flex flex-col items-center">
        <Image
          src={pub.poster ?? ""}
          width={48}
          height={48}
          alt={pub.title}
          className="w-36 h-24 object-cover rounded-md"
        />
        <button className="btn btn-accent mt-2">Modifier</button>
      </div>

      {/* Info principale */}
      <div className="flex flex-col gap-2">
        <p className="text-green-400">{pub.status}</p>
        <p className="text-sm">{pub.date}</p>
        <p className="text-lg font-semibold">{pub.title}</p>
      </div>

      {/* Statistiques */}
      <div className="flex flex-1 items-start justify-center  ">
        
        <div className="p-3 rounded-lg">
          <p className="text-sm text-neutral-400 ml-2 font-bold">Statistique:</p>
          <div className="flex items-center gap-2">
            <div className="rounded-md p-2 text-center bg-green-200">
              <Ligature className="w-5 h-5"/>  
            </div>
            <div>
                <h4 className="text-red-400 font-bold">{pub.stats?.conversions ?? "-"}</h4>
                <p className="text-xs text-neutral-400">des abon.</p>

            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-md p-2 text-center bg-green-200">
              <Ligature className="w-5 h-5"/>  
            </div>
            <div>
                <h4 className="text-red-400 font-bold">{pub.stats?.views ?? "-"}</h4>
                <p className="text-xs text-neutral-400">de vues</p>

            </div>
          </div>
          
           
        
        </div>
       
      </div>

      {/* Revenu Géographique */}
      <div className="flex-1">
        <h3 className="font-semibold ">Revenu géographique</h3>
        <div className="">
          {pub.geo?.map((g) => (
            <div key={g.label}>
              <div className="flex items-center justify-between">
                  <p className="text-sm">{g.label}</p>
                  <p className="text-sm">{g.value.toLocaleString()} f</p>    
              </div>
              <progress className={`progress w-full ${g.color ?? "progress-primary"}`} value={g.value} max={g.max ?? g.value}></progress>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
