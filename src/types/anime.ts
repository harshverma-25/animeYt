export type VerificationStatus =
  | 'discovered'
  | 'pending_review'
  | 'verified'
  | 'unverified'
  | 'rejected'
  | 'unavailable';

export type AnimeStatus = 'Ongoing' | 'Completed' | 'Upcoming';
export type AudioLanguage = 'Hindi' | 'English' | 'Japanese' | string;

export interface IAnime {
  _id?: any;
  id?: string;
  anilistId?: number;
  title: string;
  englishTitle?: string;
  romajiTitle?: string;
  nativeTitle?: string;
  slug: string;
  synopsis: string;
  poster: string;
  backdrop?: string;
  genres: string[];
  format?: string;
  releaseYear: number;
  status: AnimeStatus;
  isFeatured?: boolean;
  popularityScore: number;
  rating?: string;
  verifiedEpisodeCount?: number;
  externalMetadataSource?: string;
  metadataLastSyncedAt?: string | Date;
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
  sourceUrl?: string;
  feedUrl?: string;
  trackedAnimeSlugs?: string[];
  languages?: string[];
  playlistIds?: string[];
  lastSuccessfulCheckAt?: string | Date;
  lastAttemptedCheckAt?: string | Date;
  lastError?: string;
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
  languageCode?: string; // 'hi' | 'en' | 'ja'
  displayTitle?: string;
  subtitleLanguages: string[];
  sourceChannel?: any; // SourceChannel ID
  channelName: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string | Date;
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
  videoUrl?: string;
  playlistId?: string;
  publicationDate?: string | Date;
  verificationStatus: VerificationStatus;
  isPublished?: boolean;
  isEmbeddable?: boolean;
  duration?: string;
  thumbnail?: string;
  sourceChannelName?: string;
  sourceChannelId?: string;
  languageCode?: string;
  verifiedAt?: string | Date;
  verifiedBy?: string;
  verificationNotes?: string;
  lastAvailabilityCheckAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IYouTubeCandidate {
  _id?: any;
  id?: string;
  youtubeVideoId: string;
  channelId: string;
  channelTitle: string;
  playlistId?: string;
  videoTitle: string;
  videoDescription?: string;
  thumbnailUrl?: string;
  duration?: string;
  candidateAnimeId?: any;
  candidateAnimeSlug?: string;
  candidateEpisodeNumber?: number;
  candidateSeasonNumber?: number;
  claimedLanguage: string;
  discoveryMethod: 'channel_playlist' | 'channel_search' | 'targeted_search' | 'manual' | 'atom_feed';
  verificationStatus: VerificationStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string | Date;
  publishedEpisodeId?: any;
  lastAvailabilityCheckAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IImportJob {
  _id?: any;
  id?: string;
  dataSource: 'anilist' | 'youtube' | 'availability_check';
  jobType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  processedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  cursor?: string;
  errorSummary?: string;
  startedAt?: string | Date;
  completedAt?: string | Date;
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
  verifiedOnly?: boolean;
  ids?: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
