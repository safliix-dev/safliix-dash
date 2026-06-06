export interface ContentStatsOverview {
  totalViews: number;
  revenue: number;
  avgWatchDurationMinutes: number;
  completionRate: number;
  avgRating: number;
  playlistAddCount: number;
}

export interface RevenuePoint {
  date: string;
  amount: number;
}

export interface TopCountry {
  label: string;
  value: number;
}

export interface FilmSpecificStats {
  totalRentals: number;
  totalSubscriptionViews: number;
  rentalRevenue: number;
  subscriptionRevenue: number;
  peakRentalDate: string;
  peakRentalCount: number;
}

export interface MostWatchedEpisode {
  episodeId: string;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  views: number;
}

export interface MostPopularSeason {
  seasonId: string;
  seasonNumber: number;
  views: number;
}

export interface SeasonRetention {
  fromSeason: number;
  toSeason: number;
  retentionRate: number;
}

export interface SerieSpecificStats {
  activeSubscribersThisMonth: number;
  mostWatchedEpisode: MostWatchedEpisode | null;
  mostPopularSeason: MostPopularSeason | null;
  seasonRetention: SeasonRetention[];
}

export interface ContentDetailStats {
  overview: ContentStatsOverview;
  revenueEvolution: RevenuePoint[];
  topCountries: TopCountry[];
  filmStats: FilmSpecificStats | null;
  serieStats: SerieSpecificStats | null;
}
