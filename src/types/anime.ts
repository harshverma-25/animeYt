export type VerificationStatus = 'verified' | 'unverified' | 'unavailable';
export type AnimeStatus = 'Ongoing' | 'Completed' | 'Upcoming';
export type AudioLanguage = 'Hindi' | 'English' | 'Japanese' | string;

export interface IAnime {
  _id?: any;
  id?: string;
  title: string;
  slug: string;
  synopsis: string;
  poster: string;
  backdrop?: string;
  genres: string[];
  releaseYear: number;
  status: AnimeStatus;
  isFeatured?: boolean;
  popularityScore: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ISourceChannel {
  _id?: any;
  id?: string;
  channelId: string;
  channelName: string;
  officialSourceVerificationStatus: 'verified' | 'pending' | 'rejected';
  isEnabled: boolean;
  customUrl?: string;
  description?: string;
  lastImportAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IAnimeVersion {
  _id?: any;
  id?: string;
  anime: any; // Anime ID
  audioLanguage: AudioLanguage;
  subtitleLanguages: string[];
  sourceChannel?: any; // SourceChannel ID
  channelName: string;
  verificationStatus: VerificationStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IEpisode {
  _id?: any;
  id?: string;
  anime: any; // Anime ID
  version: any; // AnimeVersion ID
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  youtubeVideoId: string;
  playlistId?: string;
  publicationDate?: string | Date;
  verificationStatus: VerificationStatus;
  duration?: string;
  thumbnail?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AnimeWithDetails extends IAnime {
  versions: (IAnimeVersion & {
    episodes: IEpisode[];
  })[];
  availableAudioLanguages: string[];
  totalEpisodes: number;
}

export interface CatalogueQueryParams {
  query?: string;
  audioLanguage?: string;
  subtitleLanguage?: string;
  genre?: string;
  sortBy?: 'popular' | 'recent' | 'title' | 'year';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
