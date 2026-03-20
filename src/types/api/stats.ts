import { type TimeRangeParams } from "./common";

export interface StatsPoint {
  label: string;
  value: number;
}

export interface StatsSeries {
  name: string;
  data: StatsPoint[];
}

export interface BaseStatsResponse {
  series: StatsSeries[];
  summary?: Record<string, number>;
  totals?: Record<string, number>;
}

export interface StatsQueryParams extends TimeRangeParams {
  groupBy?: string;
}

export type FilmsStatsResponse = BaseStatsResponse;

export interface RevenueStatsResponse extends BaseStatsResponse {
  totals?: {
    total?: number;
    subscriptions?: number;
    rentals?: number;
    [key: string]: number | undefined;
  };
}

export type UsersStatsResponse = BaseStatsResponse;

export interface PubGeoBreakdown {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export interface PubStatsItem {
  id: string;
  title: string;
  status?: string;
  date?: string;
  poster?: string;
  stats?: Record<string, string | number> & {
    conversions?: string | number;
    views?: string | number;
  };
  geo?: PubGeoBreakdown[];
}

export interface PubStatsResponse {
  items: PubStatsItem[];
}

export interface PubStatsDetail extends PubStatsItem {
  startDate?: string;
  endDate?: string;
  budget?: string | number;
  stats?: PubStatsItem["stats"] & {
    ctaClicks?: number;
    reach?: string | number;
  };
  activity?: { label: string; at: string }[];
}
