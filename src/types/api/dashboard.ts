import { type TimeRangeParams } from "./common";

export type DashboardMetricsParams = TimeRangeParams;

export interface DashboardMetricsResponse {
  revenueTotal: number;
  newUsers: number;
  newProducts: number;
  watching: number;
  minutes: number;
  trends?: Record<string, number>;
}

export interface HighlightContent {
  id: string;
  title: string;
  type: string;
  status: string;
  price: number;
  date: string;
  publisher: string;
  stats?: Record<string, unknown>;
}

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export interface TopCountry {
  name: string;
  value: number;
}

export interface DashboardHighlightsResponse {
  recentContents: HighlightContent[];
  donuts: DonutSegment[];
  topCountries: TopCountry[];
}

export interface LocationSubscriptionPoint {
  name: string;
  value: number;
}

export interface LocationSubscriptionSeries {
  name: string;
  series: LocationSubscriptionPoint[];
}

export type DashboardRepartitionParams = TimeRangeParams;

export interface DashboardRepartitionResponse {
  countries: TopCountry[];
  locationVsSubscription: LocationSubscriptionSeries[];
}
