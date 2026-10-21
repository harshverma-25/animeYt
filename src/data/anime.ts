export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  youtubeVideoId: string;
  duration: string;
  thumbnail?: string;
  channelName: string;
  channelUrl: string;
  audioLanguage: string;
}

export interface AnimeVersion {
  id: string;
  audioLanguage: string;
  channelName: string;
  channelUrl: string;
  episodes: Episode[];
}

export interface AnimeItem {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  synopsis: string;
  releaseYear: number;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  genres: string[];
  rating: string;
  languages: string[];
  totalEpisodes: number;
  isPopular?: boolean;
  isRecentlyAdded?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  poster?: string;
  backdrop?: string;
  themeGradient?: {
    from: string;
    via?: string;
    to: string;
    orbColor: string;
  };
  versions?: AnimeVersion[];
}

export const GENRE_COLORS: Record<string, string> = {
  Action: '#FF5A7A',
  Adventure: '#FFB347',
  Comedy: '#FFD447',
  Fantasy: '#9B6BFF',
  Romance: '#FF8AC2',
  'Sci-Fi': '#6FE3FF',
  Thriller: '#7EE0C3',
};

export const CHANNELS = [
  {
    name: 'Muse Asia',
    url: 'https://youtube.com/@MuseAsia',
    verified: true,
    description: 'Official licensed distributor of anime across South and Southeast Asia.',
  },
  {
    name: 'Muse India',
    url: 'https://youtube.com/@MuseIndia',
    verified: true,
    description: 'Official YouTube home for Hindi dubs and simulcasts by Muse Communication.',
  },
  {
    name: 'Ani-One Asia',
    url: 'https://youtube.com/@AniOneAsia',
    verified: true,
    description: 'Official anime platform by Medialink for Asian territories.',
  },
];

// Production catalogue is database-driven from MongoDB.
// Empty array fallback ensures no hardcoded mock records are leaked in production.
export const ANIME_LIST: AnimeItem[] = [];

