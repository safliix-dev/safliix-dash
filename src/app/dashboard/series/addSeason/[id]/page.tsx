// app/dashboard/series/detail/[id]/seasons/add/page.tsx

import Header from "@/ui/components/header";
import Link from "next/link";
import { SeasonFormClient } from "./client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id: seriesId } = await params;

  return (
    <div className="space-y-4">
      <Header title="Ajouter une saison">
        <div className="flex gap-2">
          <Link href={`/dashboard/series/detail/${seriesId}`} className="btn btn-ghost btn-sm">
            Retour
          </Link>
        </div>
      </Header>

      <SeasonFormClient seriesId={seriesId} />
    </div>
  );
}