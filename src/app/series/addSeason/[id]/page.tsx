// app/series/detail/[id]/seasons/add/page.tsx

import { SeasonFormClient } from "./client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id: seriesId } = await params;

  return <SeasonFormClient seriesId={seriesId} />;
}