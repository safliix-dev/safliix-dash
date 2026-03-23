// app/dashboard/pub/add/page.tsx

import Header from "@/ui/components/header";
import Link from "next/link";
import { AdsFormClient } from "./client";

export default async function Page() {
  return (
    <div className="space-y-5">
      <Header title="Espace disponibilité" className="rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="badge badge-success badge-sm px-3 py-1 text-xs rounded-full">Disponible</span>
          <Link href="/dashboard/pub" className="btn btn-outline btn-sm border-base-300 text-white">
            Liste
          </Link>
        </div>
      </Header>

      <AdsFormClient />
    </div>
  );
}