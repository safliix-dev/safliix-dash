// app/series/detail/[id]/seasons/add/page.tsx

import Header from "@/ui/components/header";
import { SeasonFormClient } from "./client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id: seriesId } = await params;

  return (
    <div className="space-y-4">
      <Header title="Ajouter une saison" backHref="/series" />

      <SeasonFormClient seriesId={seriesId} />
    </div>
  );
}