export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  youtubeVideoId: string;
  duration: string;
  thumbnail?: string;
  channelName: string;
  channelUrl: string;
  audioLanguage: 'Japanese' | 'Hindi' | 'English';
}

export interface AnimeVersion {
  id: string;
  audioLanguage: 'Japanese' | 'Hindi' | 'English';
  channelName: string;
  channelUrl: string;
  episodes: Episode[];
}

export interface AnimeItem {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  poster?: string;
  backdrop?: string;
  synopsis: string;
  releaseYear: number;
  status: 'Ongoing' | 'Completed';
  genres: ('Action' | 'Adventure' | 'Comedy' | 'Fantasy' | 'Romance' | 'Sci-Fi' | 'Thriller')[];
  rating: string;
  languages: ('Japanese' | 'Hindi' | 'English')[];
  totalEpisodes: number;
  isPopular?: boolean;
  isRecentlyAdded?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  themeGradient: {
    from: string;
    via?: string;
    to: string;
    orbColor: string;
  };
  keyArtOverlay?: string;
  versions: AnimeVersion[];
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

export const ANIME_LIST: AnimeItem[] = [
  // 1. Demon Slayer (Featured & Popular #1)
  {
    id: 'demon-slayer',
    slug: 'demon-slayer',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    originalTitle: '鬼滅の刃',
    synopsis: 'Tanjiro Kamado, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself. Tanjiro sets out on a dangerous journey to find a way to return Nezuko to normal and destroy the demon who ruined his life.',
    releaseYear: 2019,
    status: 'Ongoing',
    genres: ['Action', 'Fantasy'],
    rating: '8.9',
    languages: ['Japanese', 'Hindi'],
    totalEpisodes: 5,
    isPopular: true,
    isTrending: true,
    isFeatured: true,
    themeGradient: {
      from: '#8B1E3F',
      via: '#4A122E',
      to: '#1A0B2E',
      orbColor: '#FF5A7A',
    },
    versions: [
      {
        id: 'ds-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'ds-ep-1',
            episodeNumber: 1,
            title: 'Cruelty',
            youtubeVideoId: 'VQGCKyvzIM4',
            duration: '23:40',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'ds-ep-2',
            episodeNumber: 2,
            title: 'Trainer Sakonji Urokodaki',
            youtubeVideoId: 'pmanD_s7G3U',
            duration: '23:40',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'ds-ep-3',
            episodeNumber: 3,
            title: 'Sabito and Makomo',
            youtubeVideoId: 'Ylbc0Y_dYQc',
            duration: '23:40',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'ds-ep-4',
            episodeNumber: 4,
            title: 'Final Selection',
            youtubeVideoId: 'm79t4tK_q9U',
            duration: '23:40',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'ds-ep-5',
            episodeNumber: 5,
            title: 'My Own Steel',
            youtubeVideoId: 'f0Xz9vE8lXg',
            duration: '23:40',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
      {
        id: 'ds-hi',
        audioLanguage: 'Hindi',
        channelName: 'Muse India',
        channelUrl: 'https://youtube.com/@MuseIndia',
        episodes: [
          {
            id: 'ds-hi-ep-1',
            episodeNumber: 1,
            title: 'Cruelty (Hindi Dub)',
            youtubeVideoId: 'VQGCKyvzIM4',
            duration: '23:40',
            channelName: 'Muse India',
            channelUrl: 'https://youtube.com/@MuseIndia',
            audioLanguage: 'Hindi',
          },
          {
            id: 'ds-hi-ep-2',
            episodeNumber: 2,
            title: 'Trainer Sakonji Urokodaki (Hindi Dub)',
            youtubeVideoId: 'pmanD_s7G3U',
            duration: '23:40',
            channelName: 'Muse India',
            channelUrl: 'https://youtube.com/@MuseIndia',
            audioLanguage: 'Hindi',
          },
        ],
      },
    ],
  },

  // 2. Jujutsu Kaisen (Popular #2, Trending #2)
  {
    id: 'jujutsu-kaisen',
    slug: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    originalTitle: '呪術廻戦',
    synopsis: 'Yuji Itadori, a kind-hearted teenager, joins his school\'s Occult Club for fun, but discovers that its members are actual sorcerers who can manipulate the energy between beings for their own use. He hears about a cursed talisman - the finger of Sukuna, a demon - and is targeted by other cursed beings.',
    releaseYear: 2020,
    status: 'Ongoing',
    genres: ['Action', 'Fantasy'],
    rating: '8.6',
    languages: ['Japanese', 'English'],
    totalEpisodes: 3,
    isPopular: true,
    isTrending: true,
    isFeatured: true,
    themeGradient: {
      from: '#2E1A6E',
      via: '#1E1242',
      to: '#0D0820',
      orbColor: '#9B6BFF',
    },
    versions: [
      {
        id: 'jjk-jp',
        audioLanguage: 'Japanese',
        channelName: 'Ani-One Asia',
        channelUrl: 'https://youtube.com/@AniOneAsia',
        episodes: [
          {
            id: 'jjk-ep-1',
            episodeNumber: 1,
            title: 'Ryomen Sukuna',
            youtubeVideoId: 'dgzmpzY4tGg',
            duration: '23:55',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'jjk-ep-2',
            episodeNumber: 2,
            title: 'For Myself',
            youtubeVideoId: 'GWAiIebjZ2M',
            duration: '23:55',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'jjk-ep-3',
            episodeNumber: 3,
            title: 'Girl of Steel',
            youtubeVideoId: 'BthP2hGjVjU',
            duration: '23:55',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
    ],
  },

  // 3. One Piece (Popular #3, Trending #3)
  {
    id: 'one-piece',
    slug: 'one-piece',
    title: 'One Piece',
    originalTitle: 'ワンピース',
    synopsis: 'Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the king of all pirates. With a course charted for the treacherous waters of the Grand Line and beyond, this is one captain who will never give up until he has claimed the greatest treasure on Earth: the Legendary One Piece!',
    releaseYear: 1999,
    status: 'Ongoing',
    genres: ['Action', 'Adventure'],
    rating: '8.9',
    languages: ['Japanese', 'Hindi'],
    totalEpisodes: 3,
    isPopular: true,
    isTrending: true,
    isFeatured: true,
    themeGradient: {
      from: '#D9531E',
      via: '#7B2E15',
      to: '#1C0D0A',
      orbColor: '#FFB347',
    },
    versions: [
      {
        id: 'op-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'op-ep-1',
            episodeNumber: 1,
            title: 'I\'m Luffy! The Man Who\'s Gonna Be King of the Pirates!',
            youtubeVideoId: 'yqXbV8T2Nms',
            duration: '24:20',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'op-ep-2',
            episodeNumber: 2,
            title: 'Enter the Great Swordsman! Pirate Hunter Roronoa Zoro!',
            youtubeVideoId: 'V9q4L6N5D0w',
            duration: '24:20',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'op-ep-3',
            episodeNumber: 3,
            title: 'Morgan versus Luffy! Who\'s the Mysterious Pretty Girl?',
            youtubeVideoId: 'GqK_K8v0S1A',
            duration: '24:20',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
      {
        id: 'op-hi',
        audioLanguage: 'Hindi',
        channelName: 'Muse India',
        channelUrl: 'https://youtube.com/@MuseIndia',
        episodes: [
          {
            id: 'op-hi-ep-1',
            episodeNumber: 1,
            title: 'Main Hoon Luffy! (Hindi Dub)',
            youtubeVideoId: 'yqXbV8T2Nms',
            duration: '24:20',
            channelName: 'Muse India',
            channelUrl: 'https://youtube.com/@MuseIndia',
            audioLanguage: 'Hindi',
          },
        ],
      },
    ],
  },

  // 4. Attack on Titan (Popular #4)
  {
    id: 'attack-on-titan',
    slug: 'attack-on-titan',
    title: 'Attack on Titan',
    originalTitle: '進撃の巨人',
    synopsis: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide in fear behind enormous concentric walls. What makes these giants truly terrifying is that their taste for human flesh is not born out of hunger but what appears to be out of pleasure.',
    releaseYear: 2013,
    status: 'Completed',
    genres: ['Action', 'Fantasy'],
    rating: '9.0',
    languages: ['Japanese', 'English'],
    totalEpisodes: 5,
    isPopular: true,
    themeGradient: {
      from: '#2A4356',
      via: '#1B2C3A',
      to: '#0D171E',
      orbColor: '#6FE3FF',
    },
    versions: [
      {
        id: 'aot-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'aot-ep-1',
            episodeNumber: 1,
            title: 'To You, in 2000 Years: The Fall of Shiganshina, Part 1',
            youtubeVideoId: 'MGRm4IzK1SQ',
            duration: '24:12',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'aot-ep-2',
            episodeNumber: 2,
            title: 'That Day: The Fall of Shiganshina, Part 2',
            youtubeVideoId: 'Kz7vC3L9kKw',
            duration: '24:12',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'aot-ep-3',
            episodeNumber: 3,
            title: 'A Dim Light Amid Despair',
            youtubeVideoId: 'Wz3K9L5M8Qw',
            duration: '24:12',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'aot-ep-4',
            episodeNumber: 4,
            title: 'The Night of the Graduation Ceremony',
            youtubeVideoId: 'Jq5M2L7kKwA',
            duration: '24:12',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'aot-ep-5',
            episodeNumber: 5,
            title: 'First Battle: Attack on Trost, Part 1',
            youtubeVideoId: 'Lz8M3L2kKxB',
            duration: '24:12',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
    ],
  },

  // 5. Naruto Shippuden (Popular #5)
  {
    id: 'naruto-shippuden',
    slug: 'naruto-shippuden',
    title: 'Naruto Shippuden',
    originalTitle: 'NARUTO -ナルト- 疾風伝',
    synopsis: 'Naruto Uzumaki is a young ninja with a sealed demon fox in his belly who dreams of becoming the greatest shinobi leader, the Hokage. After two and a half years of training with Jiraiya, he returns home to the Hidden Leaf Village with stronger determination and fierce allies.',
    releaseYear: 2007,
    status: 'Completed',
    genres: ['Action', 'Adventure'],
    rating: '8.7',
    languages: ['Japanese', 'Hindi'],
    totalEpisodes: 3,
    isPopular: true,
    themeGradient: {
      from: '#D86B1E',
      via: '#7C3B0E',
      to: '#1C0E06',
      orbColor: '#FFB347',
    },
    versions: [
      {
        id: 'naruto-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'naruto-ep-1',
            episodeNumber: 1,
            title: 'Homecoming',
            youtubeVideoId: '3c0P72lD7aY',
            duration: '23:30',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'naruto-ep-2',
            episodeNumber: 2,
            title: 'The Akatsuki Makes Its Move',
            youtubeVideoId: 'kP6W_oM0B7g',
            duration: '23:30',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'naruto-ep-3',
            episodeNumber: 3,
            title: 'The Results of Training',
            youtubeVideoId: '7L8G2j1w2zQ',
            duration: '23:30',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
      {
        id: 'naruto-hi',
        audioLanguage: 'Hindi',
        channelName: 'Muse India',
        channelUrl: 'https://youtube.com/@MuseIndia',
        episodes: [
          {
            id: 'naruto-hi-ep-1',
            episodeNumber: 1,
            title: 'Homecoming (Hindi Dub)',
            youtubeVideoId: '3c0P72lD7aY',
            duration: '23:30',
            channelName: 'Muse India',
            channelUrl: 'https://youtube.com/@MuseIndia',
            audioLanguage: 'Hindi',
          },
        ],
      },
    ],
  },

  // 6. Spy x Family (Popular #6)
  {
    id: 'spy-x-family',
    slug: 'spy-x-family',
    title: 'Spy x Family',
    originalTitle: 'スパイファミリー',
    synopsis: 'World peace is at stake and secret agent Twilight must undergo his most difficult mission yet-pretend to be a family man. Posing as the loving husband and father, he will infiltrate an elite school to get close to a high-profile politician. What he doesn\'t know is that his wife is a deadly assassin and his adopted daughter is a telepath!',
    releaseYear: 2022,
    status: 'Ongoing',
    genres: ['Comedy', 'Action'],
    rating: '8.5',
    languages: ['Japanese', 'English'],
    totalEpisodes: 5,
    isPopular: true,
    themeGradient: {
      from: '#1C7C75',
      via: '#124844',
      to: '#071C1B',
      orbColor: '#7EE0C3',
    },
    versions: [
      {
        id: 'sxf-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'sxf-ep-1',
            episodeNumber: 1,
            title: 'Operation Strix',
            youtubeVideoId: 'Oqd218qQQ00',
            duration: '24:10',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'sxf-ep-2',
            episodeNumber: 2,
            title: 'Secure a Wife',
            youtubeVideoId: 'gM0y2Q8gEaw',
            duration: '24:10',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'sxf-ep-3',
            episodeNumber: 3,
            title: 'Prepare for the Interview',
            youtubeVideoId: 'gM0y2Q8gEaw',
            duration: '24:10',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'sxf-ep-4',
            episodeNumber: 4,
            title: 'The Prestigious School\'s Interview',
            youtubeVideoId: 'gM0y2Q8gEaw',
            duration: '24:10',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'sxf-ep-5',
            episodeNumber: 5,
            title: 'Will They Pass or Fail',
            youtubeVideoId: 'gM0y2Q8gEaw',
            duration: '24:10',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
    ],
  },

  // 7. Solo Leveling (Recently Added #1)
  {
    id: 'solo-leveling',
    slug: 'solo-leveling',
    title: 'Solo Leveling',
    originalTitle: '俺だけレベルアップな件',
    synopsis: 'They say whatever doesn\'t kill you makes you stronger, but that\'s not the case for the world\'s weakest hunter Sung Jinwoo. After being brutally slaughtered by monsters in a high-ranking dungeon, Jinwoo came back with the System, a program only he can see, that alone is leveling him up in every way.',
    releaseYear: 2024,
    status: 'Ongoing',
    genres: ['Action', 'Fantasy'],
    rating: '8.5',
    languages: ['Japanese', 'Hindi'],
    totalEpisodes: 2,
    isRecentlyAdded: true,
    themeGradient: {
      from: '#3B1E78',
      via: '#221147',
      to: '#0D061C',
      orbColor: '#9B6BFF',
    },
    versions: [
      {
        id: 'sl-jp',
        audioLanguage: 'Japanese',
        channelName: 'Ani-One Asia',
        channelUrl: 'https://youtube.com/@AniOneAsia',
        episodes: [
          {
            id: 'sl-ep-1',
            episodeNumber: 1,
            title: 'I\'m Used to It',
            youtubeVideoId: '7L_qC0T_Q8g',
            duration: '23:45',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'sl-ep-2',
            episodeNumber: 2,
            title: 'If I Had One More Chance',
            youtubeVideoId: '4B8Xz2q8L8g',
            duration: '23:45',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
      {
        id: 'sl-hi',
        audioLanguage: 'Hindi',
        channelName: 'Muse India',
        channelUrl: 'https://youtube.com/@MuseIndia',
        episodes: [
          {
            id: 'sl-hi-ep-1',
            episodeNumber: 1,
            title: 'I\'m Used to It (Hindi Dub)',
            youtubeVideoId: '7L_qC0T_Q8g',
            duration: '23:45',
            channelName: 'Muse India',
            channelUrl: 'https://youtube.com/@MuseIndia',
            audioLanguage: 'Hindi',
          },
        ],
      },
    ],
  },

  // 8. Chainsaw Man (Recently Added #2)
  {
    id: 'chainsaw-man',
    slug: 'chainsaw-man',
    title: 'Chainsaw Man',
    originalTitle: 'チェンソーマン',
    synopsis: 'Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life while repaying his debt by harvesting devil corpses with Pochita. One day, Denji is betrayed and killed. As his consciousness fades, he makes a contract with Pochita and gets revived as "Chainsaw Man".',
    releaseYear: 2022,
    status: 'Completed',
    genres: ['Action', 'Fantasy'],
    rating: '8.5',
    languages: ['Japanese', 'English'],
    totalEpisodes: 3,
    isRecentlyAdded: true,
    themeGradient: {
      from: '#B3261E',
      via: '#671410',
      to: '#1A0605',
      orbColor: '#FF5A7A',
    },
    versions: [
      {
        id: 'csm-jp',
        audioLanguage: 'Japanese',
        channelName: 'Ani-One Asia',
        channelUrl: 'https://youtube.com/@AniOneAsia',
        episodes: [
          {
            id: 'csm-ep-1',
            episodeNumber: 1,
            title: 'Dog & Chainsaw',
            youtubeVideoId: 'j9sSZss_Yxg',
            duration: '24:00',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'csm-ep-2',
            episodeNumber: 2,
            title: 'Arrival in Tokyo',
            youtubeVideoId: 'q15CRdE5Bv0',
            duration: '24:00',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'csm-ep-3',
            episodeNumber: 3,
            title: 'Meowy\'s Whereabouts',
            youtubeVideoId: '8v_43W4usSg',
            duration: '24:00',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
    ],
  },

  // 9. Tokyo Revengers (Recently Added #3)
  {
    id: 'tokyo-revengers',
    slug: 'tokyo-revengers',
    title: 'Tokyo Revengers',
    originalTitle: '東京卍リベンジャーズ',
    synopsis: 'Takemichi Hanagaki\'s life is at an all-time low. Just when he thought it couldn\'t get worse, he finds out that Hinata Tachibana, his ex-girlfriend, was murdered by the Tokyo Manji Gang. While waiting for a train, he is pushed onto the tracks, only to awaken 12 years in the past.',
    releaseYear: 2021,
    status: 'Ongoing',
    genres: ['Action', 'Sci-Fi'],
    rating: '8.0',
    languages: ['Japanese', 'Hindi'],
    totalEpisodes: 3,
    isRecentlyAdded: true,
    themeGradient: {
      from: '#9C27B0',
      via: '#581463',
      to: '#160519',
      orbColor: '#FF8AC2',
    },
    versions: [
      {
        id: 'tr-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'tr-ep-1',
            episodeNumber: 1,
            title: 'Reborn',
            youtubeVideoId: 'wK3lX0C4Q7w',
            duration: '23:50',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'tr-ep-2',
            episodeNumber: 2,
            title: 'Resist',
            youtubeVideoId: '7L_qC0T_Q8g',
            duration: '23:50',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'tr-ep-3',
            episodeNumber: 3,
            title: 'Resolve',
            youtubeVideoId: '4B8Xz2q8L8g',
            duration: '23:50',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
      {
        id: 'tr-hi',
        audioLanguage: 'Hindi',
        channelName: 'Muse India',
        channelUrl: 'https://youtube.com/@MuseIndia',
        episodes: [
          {
            id: 'tr-hi-ep-1',
            episodeNumber: 1,
            title: 'Reborn (Hindi Dub)',
            youtubeVideoId: 'wK3lX0C4Q7w',
            duration: '23:50',
            channelName: 'Muse India',
            channelUrl: 'https://youtube.com/@MuseIndia',
            audioLanguage: 'Hindi',
          },
        ],
      },
    ],
  },

  // 10. Mob Psycho 100 (Recently Added #4)
  {
    id: 'mob-psycho-100',
    slug: 'mob-psycho-100',
    title: 'Mob Psycho 100',
    originalTitle: 'モブサイコ100',
    synopsis: 'Shigeo Kageyama, nicknamed "Mob," is a boy who has trouble expressing himself, but who happens to be a formidable esper. Mob is determined to live a normal life and keeps his ESP suppressed, but when his emotions surge to a level of 100%, something terrible happens to him!',
    releaseYear: 2016,
    status: 'Completed',
    genres: ['Action', 'Comedy'],
    rating: '8.6',
    languages: ['Japanese', 'English'],
    totalEpisodes: 2,
    isRecentlyAdded: true,
    themeGradient: {
      from: '#0288D1',
      via: '#014970',
      to: '#00131D',
      orbColor: '#6FE3FF',
    },
    versions: [
      {
        id: 'mob-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'mob-ep-1',
            episodeNumber: 1,
            title: 'Self-Proclaimed Psychic: Reigen Arataka ~And Mob~',
            youtubeVideoId: 'Bmg_jGfyVyo',
            duration: '24:00',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'mob-ep-2',
            episodeNumber: 2,
            title: 'Doubts About Youth ~The Telepathy Club Appears~',
            youtubeVideoId: 'Mv7Lz0s3L6w',
            duration: '24:00',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
    ],
  },

  // 11. My Hero Academia (Recently Added #5)
  {
    id: 'my-hero-academia',
    slug: 'my-hero-academia',
    title: 'My Hero Academia',
    originalTitle: '僕のヒーローアカデミア',
    synopsis: 'In a world where 80% of the population has superpowers called "Quirks," Izuku Midoriya is born without one. Yet his dream of becoming a hero burns brighter than anyone\'s. After a fateful encounter with All Might, the greatest hero of all, Izuku inherits his legendary power and enrols at U.A. High School.',
    releaseYear: 2016,
    status: 'Ongoing',
    genres: ['Action', 'Adventure'],
    rating: '8.3',
    languages: ['Japanese', 'English'],
    totalEpisodes: 3,
    isRecentlyAdded: true,
    themeGradient: {
      from: '#E65100',
      via: '#8D3200',
      to: '#230C00',
      orbColor: '#FFB347',
    },
    versions: [
      {
        id: 'mha-jp',
        audioLanguage: 'Japanese',
        channelName: 'Muse Asia',
        channelUrl: 'https://youtube.com/@MuseAsia',
        episodes: [
          {
            id: 'mha-ep-1',
            episodeNumber: 1,
            title: 'Izuku Midoriya: Origin',
            youtubeVideoId: 'EPVkcWyLbo8',
            duration: '24:15',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'mha-ep-2',
            episodeNumber: 2,
            title: 'What It Takes to Be a Hero',
            youtubeVideoId: 'K7k_mYqL3eA',
            duration: '24:15',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'mha-ep-3',
            episodeNumber: 3,
            title: 'Roaring Muscles',
            youtubeVideoId: '9Fq0_zZ8X2o',
            duration: '24:15',
            channelName: 'Muse Asia',
            channelUrl: 'https://youtube.com/@MuseAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
    ],
  },

  // 12. Death Note (Recently Added #6)
  {
    id: 'death-note',
    slug: 'death-note',
    title: 'Death Note',
    originalTitle: 'デスノート',
    synopsis: 'Light Yagami is an ace student with great prospects-and he\'s bored out of his mind. But all that changes when he finds the Death Note, a notebook dropped by a rogue Shinigami death god. Any human whose name is written in the notebook dies. Light decides to use this divine power to rid the world of evil, sparking a battle of wits with the mysterious detective L.',
    releaseYear: 2006,
    status: 'Completed',
    genres: ['Thriller', 'Fantasy'],
    rating: '9.0',
    languages: ['Japanese', 'English'],
    totalEpisodes: 2,
    isRecentlyAdded: true,
    themeGradient: {
      from: '#4527A0',
      via: '#26145C',
      to: '#0A0517',
      orbColor: '#7EE0C3',
    },
    versions: [
      {
        id: 'dn-jp',
        audioLanguage: 'Japanese',
        channelName: 'Ani-One Asia',
        channelUrl: 'https://youtube.com/@AniOneAsia',
        episodes: [
          {
            id: 'dn-ep-1',
            episodeNumber: 1,
            title: 'Rebirth',
            youtubeVideoId: 'kNyR46P4260',
            duration: '23:38',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
          {
            id: 'dn-ep-2',
            episodeNumber: 2,
            title: 'Confrontation',
            youtubeVideoId: 'qM0zLz8sQ_c',
            duration: '23:38',
            channelName: 'Ani-One Asia',
            channelUrl: 'https://youtube.com/@AniOneAsia',
            audioLanguage: 'Japanese',
          },
        ],
      },
    ],
  },
];

export function getAnimeBySlug(slug: string): AnimeItem | undefined {
  return ANIME_LIST.find((a) => a.slug === slug);
}

export function getPopularAnime(): AnimeItem[] {
  return ANIME_LIST.filter((a) => a.isPopular);
}

export function getRecentlyAddedAnime(): AnimeItem[] {
  return ANIME_LIST.filter((a) => a.isRecentlyAdded);
}

export function getFeaturedAnime(): AnimeItem[] {
  return ANIME_LIST.filter((a) => a.isFeatured);
}

export function getTrendingAnime(): AnimeItem[] {
  return ANIME_LIST.filter((a) => a.isTrending);
}

export function getAnimeByGenre(genre: string): AnimeItem[] {
  const norm = genre.toLowerCase();
  return ANIME_LIST.filter((a) =>
    a.genres.some((g) => g.toLowerCase() === norm)
  );
}

export function getAnimeByLanguage(lang: string): AnimeItem[] {
  const norm = lang.toLowerCase();
  return ANIME_LIST.filter((a) =>
    a.languages.some((l) => l.toLowerCase() === norm)
  );
}

export function searchAnime(query: string): AnimeItem[] {
  if (!query || !query.trim()) return ANIME_LIST;
  const q = query.toLowerCase().trim();
  return ANIME_LIST.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.synopsis.toLowerCase().includes(q) ||
      a.genres.some((g) => g.toLowerCase().includes(q)) ||
      a.languages.some((l) => l.toLowerCase().includes(q))
  );
}
