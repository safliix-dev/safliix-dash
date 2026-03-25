import { PageParamProps } from "@/types/utils";
import SeriesDetailClient from "./client";
import { seriesApi } from "@/lib/api/series";
import { cookies } from "next/headers";

export default async function Page({ params }: PageParamProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const detail = await seriesApi.detail(id, accessToken);
  const seasons = detail.seasons?.map((s) => ({ id: s.id, number: String(s.numero ?? s.id) })) ?? [];

  return <SeriesDetailClient id={id} seasons={seasons} detail={detail} />;
}
