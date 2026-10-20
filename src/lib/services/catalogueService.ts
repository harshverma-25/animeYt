import { connectToDatabase, isDbConnected } from '@/lib/db/mongodb';
import { Anime } from '@/lib/db/models/Anime';
import { AnimeVersion } from '@/lib/db/models/AnimeVersion';
import { Episode } from '@/lib/db/models/Episode';
import { SourceChannel } from '@/lib/db/models/SourceChannel';
import {
  IAnime,
  IAnimeVersion,
  IEpisode,
  AnimeWithDetails,
  CatalogueQueryParams,
  PaginatedResult,
  VerificationStatus,
  ISourceChannel,
} from '@/types/anime';
import {
  SEED_ANIME,
  SEED_VERSIONS,
  SEED_EPISODES,
  SEED_CHANNELS,
} from '@/lib/data/seedData';

// In-memory mutable fallback store for seamless offline/fallback functionality
const fallbackStore = {
  channels: [...SEED_CHANNELS],
  anime: [...SEED_ANIME],
  versions: [...SEED_VERSIONS],
  episodes: [...SEED_EPISODES],
};

export class CatalogueService {
  /**
   * Helper to ensure database is checked. Returns true if real MongoDB is ready.
   */
  private static async ensureDb(): Promise<boolean> {
    try {
      const conn = await connectToDatabase();
      if (conn && isDbConnected()) {
        const count = await Anime.estimatedDocumentCount();
        if (count > 0) {
          return true;
        }
      }
    } catch (e) {
      console.warn('Database check failed, using fallback catalogue:', e);
    }
    return false;
  }

  /**
   * Retrieve list of unique available genres across the catalogue
   */
  static async getGenres(): Promise<string[]> {
    const useDb = await this.ensureDb();
    if (useDb) {
      const genres = await Anime.distinct('genres');
      return genres.filter(Boolean).sort();
    }
    const set = new Set<string>();
    fallbackStore.anime.forEach((a) => a.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }

  /**
   * Retrieve list of unique available audio languages across verified versions
   */
  static async getAudioLanguages(): Promise<string[]> {
    const useDb = await this.ensureDb();
    if (useDb) {
      const languages = await AnimeVersion.distinct('audioLanguage', {
        verificationStatus: 'verified',
      });
      return languages.filter(Boolean).sort();
    }
    const set = new Set<string>();
    fallbackStore.versions
      .filter((v) => v.verificationStatus === 'verified')
      .forEach((v) => set.add(v.audioLanguage));
    return Array.from(set).sort();
  }

  /**
   * Main query function for home and explore pages with filters, search, and pagination
   */
  static async getCatalogue(params: CatalogueQueryParams): Promise<
    PaginatedResult<
      IAnime & {
        availableAudioLanguages: string[];
        totalEpisodes: number;
      }
    >
  > {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(params.limit) || 12));
    const skip = (page - 1) * limit;

    const useDb = await this.ensureDb();

    if (useDb) {
      // Build MongoDB query
      const query: Record<string, unknown> = {};

      if (params.query?.trim()) {
        const searchRegex = new RegExp(params.query.trim(), 'i');
        query.$or = [{ title: searchRegex }, { synopsis: searchRegex }, { genres: searchRegex }];
      }

      if (params.genre && params.genre !== 'All') {
        query.genres = params.genre;
      }

      // If audio language filter applied, find matching anime IDs
      if (params.audioLanguage && params.audioLanguage !== 'All') {
        const matchingVersions = await AnimeVersion.find({
          audioLanguage: params.audioLanguage,
          verificationStatus: 'verified',
        }).select('anime');
        const animeIds = matchingVersions.map((v) => v.anime);
        query._id = { $in: animeIds };
      }

      // Sort criteria
      let sortField: Record<string, 1 | -1> = { popularityScore: -1, createdAt: -1 };
      if (params.sortBy === 'recent') {
        sortField = { createdAt: -1 };
      } else if (params.sortBy === 'title') {
        sortField = { title: 1 };
      } else if (params.sortBy === 'year') {
        sortField = { releaseYear: -1 };
      }

      const total = await Anime.countDocuments(query);
      const docs = await Anime.find(query).sort(sortField).skip(skip).limit(limit).lean();

      // Enrich with available audio languages and total verified episodes
      const items = await Promise.all(
        docs.map(async (doc) => {
          const docId = doc._id.toString();
          const versions = await AnimeVersion.find({
            anime: docId,
            verificationStatus: 'verified',
          }).lean();

          const audioLangs = Array.from(new Set(versions.map((v) => v.audioLanguage)));
          const versionIds = versions.map((v) => v._id);
          const totalEpisodes = await Episode.countDocuments({
            version: { $in: versionIds as any },
            verificationStatus: 'verified',
          });

          return {
            id: docId,
            title: doc.title,
            slug: doc.slug,
            synopsis: doc.synopsis,
            poster: doc.poster,
            backdrop: doc.backdrop,
            genres: doc.genres,
            releaseYear: doc.releaseYear,
            status: doc.status,
            isFeatured: doc.isFeatured,
            popularityScore: doc.popularityScore,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            availableAudioLanguages: audioLangs,
            totalEpisodes,
          };
        })
      );

      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      };
    }

    // In-memory fallback querying
    let filtered = [...fallbackStore.anime];

    if (params.query?.trim()) {
      const q = params.query.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.synopsis.toLowerCase().includes(q) ||
          a.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    if (params.genre && params.genre !== 'All') {
      filtered = filtered.filter((a) =>
        a.genres.some((g) => g.toLowerCase() === params.genre?.toLowerCase())
      );
    }

    if (params.audioLanguage && params.audioLanguage !== 'All') {
      const targetLang = params.audioLanguage.toLowerCase();
      filtered = filtered.filter((a) => {
        const aId = a.id || a._id;
        return fallbackStore.versions.some(
          (v) =>
            v.anime === aId &&
            v.verificationStatus === 'verified' &&
            v.audioLanguage.toLowerCase() === targetLang
        );
      });
    }

    if (params.subtitleLanguage && params.subtitleLanguage !== 'All') {
      const targetSub = params.subtitleLanguage.toLowerCase();
      filtered = filtered.filter((a) => {
        const aId = a.id || a._id;
        return fallbackStore.versions.some(
          (v) =>
            v.anime === aId &&
            v.verificationStatus === 'verified' &&
            v.subtitleLanguages.some((sub) => sub.toLowerCase() === targetSub)
        );
      });
    }

    // Sorting
    if (params.sortBy === 'recent') {
      filtered.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } else if (params.sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (params.sortBy === 'year') {
      filtered.sort((a, b) => b.releaseYear - a.releaseYear);
    } else {
      // Default: popularity
      filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    const items = paginated.map((a) => {
      const aId = a.id || a._id;
      const versions = fallbackStore.versions.filter(
        (v) => v.anime === aId && v.verificationStatus === 'verified'
      );
      const audioLangs = Array.from(new Set(versions.map((v) => v.audioLanguage)));
      const versionIds = new Set(versions.map((v) => v.id || v._id));
      const totalEpisodes = fallbackStore.episodes.filter(
        (ep) => versionIds.has(ep.version) && ep.verificationStatus === 'verified'
      ).length;

      return {
        ...a,
        availableAudioLanguages: audioLangs,
        totalEpisodes,
      };
    });

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Get featured anime for the featured strip
   */
  static async getFeaturedAnime(): Promise<IAnime[]> {
    const res = await this.getCatalogue({ limit: 4, sortBy: 'popular' });
    const featured = res.items.filter((a) => a.isFeatured);
    return featured.length > 0 ? featured : res.items.slice(0, 3);
  }

  /**
   * Get popular anime
   */
  static async getPopularAnime(limit = 6): Promise<
    (IAnime & {
      availableAudioLanguages: string[];
      totalEpisodes: number;
    })[]
  > {
    const res = await this.getCatalogue({ limit, sortBy: 'popular' });
    return res.items;
  }

  /**
   * Get recently added anime
   */
  static async getRecentlyAddedAnime(limit = 6): Promise<
    (IAnime & {
      availableAudioLanguages: string[];
      totalEpisodes: number;
    })[]
  > {
    const res = await this.getCatalogue({ limit, sortBy: 'recent' });
    return res.items;
  }

  /**
   * Get full details for an anime by slug, including verified versions and episodes
   */
  static async getAnimeBySlug(slug: string): Promise<AnimeWithDetails | null> {
    const useDb = await this.ensureDb();

    if (useDb) {
      const animeDoc = await Anime.findOne({ slug: slug.toLowerCase() }).lean();
      if (!animeDoc) return null;

      const animeId = animeDoc._id.toString();

      // Only fetch verified versions for public display
      const versionDocs = await AnimeVersion.find({
        anime: animeId,
        verificationStatus: 'verified',
      }).lean();

      const versionsWithEpisodes = await Promise.all(
        versionDocs.map(async (v) => {
          const vId = v._id.toString();
          const epDocs = await Episode.find({
            version: vId,
            verificationStatus: 'verified',
          })
            .sort({ seasonNumber: 1, episodeNumber: 1 })
            .lean();

          return {
            id: vId,
            _id: vId,
            anime: animeId,
            audioLanguage: v.audioLanguage,
            subtitleLanguages: v.subtitleLanguages || [],
            sourceChannel: v.sourceChannel?.toString(),
            channelName: v.channelName,
            verificationStatus: v.verificationStatus,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            episodes: epDocs.map((ep) => ({
              id: ep._id.toString(),
              _id: ep._id.toString(),
              anime: animeId,
              version: vId,
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.episodeNumber,
              title: ep.title,
              youtubeVideoId: ep.youtubeVideoId,
              playlistId: ep.playlistId,
              publicationDate: ep.publicationDate,
              verificationStatus: ep.verificationStatus,
              duration: ep.duration,
              thumbnail: ep.thumbnail,
              createdAt: ep.createdAt,
              updatedAt: ep.updatedAt,
            })),
          };
        })
      );

      const availableAudioLanguages = Array.from(
        new Set(versionsWithEpisodes.map((v) => v.audioLanguage))
      );

      const totalEpisodes = versionsWithEpisodes.reduce((acc, v) => acc + v.episodes.length, 0);

      return {
        id: animeId,
        _id: animeId,
        title: animeDoc.title,
        slug: animeDoc.slug,
        synopsis: animeDoc.synopsis,
        poster: animeDoc.poster,
        backdrop: animeDoc.backdrop,
        genres: animeDoc.genres,
        releaseYear: animeDoc.releaseYear,
        status: animeDoc.status,
        isFeatured: animeDoc.isFeatured,
        popularityScore: animeDoc.popularityScore,
        createdAt: animeDoc.createdAt,
        updatedAt: animeDoc.updatedAt,
        versions: versionsWithEpisodes,
        availableAudioLanguages,
        totalEpisodes,
      };
    }

    // Fallback store
    const anime = fallbackStore.anime.find((a) => a.slug === slug.toLowerCase());
    if (!anime) return null;

    const animeId = anime.id || anime._id;
    const versions = fallbackStore.versions.filter(
      (v) => v.anime === animeId && v.verificationStatus === 'verified'
    );

    const versionsWithEpisodes = versions.map((v) => {
      const vId = v.id || v._id;
      const eps = fallbackStore.episodes
        .filter((ep) => ep.version === vId && ep.verificationStatus === 'verified')
        .sort((a, b) =>
          a.seasonNumber !== b.seasonNumber
            ? a.seasonNumber - b.seasonNumber
            : a.episodeNumber - b.episodeNumber
        );

      return {
        ...v,
        id: vId,
        episodes: eps,
      };
    });

    const availableAudioLanguages = Array.from(new Set(versions.map((v) => v.audioLanguage)));
    const totalEpisodes = versionsWithEpisodes.reduce((acc, v) => acc + v.episodes.length, 0);

    return {
      ...anime,
      id: animeId,
      versions: versionsWithEpisodes,
      availableAudioLanguages,
      totalEpisodes,
    };
  }

  /**
   * Get a single episode by ID
   */
  static async getEpisodeById(episodeId: string): Promise<IEpisode | null> {
    const useDb = await this.ensureDb();
    if (useDb) {
      const ep = await Episode.findById(episodeId).lean();
      if (!ep) return null;
      return {
        id: ep._id.toString(),
        _id: ep._id.toString(),
        anime: ep.anime.toString(),
        version: ep.version.toString(),
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        youtubeVideoId: ep.youtubeVideoId,
        playlistId: ep.playlistId,
        publicationDate: ep.publicationDate,
        verificationStatus: ep.verificationStatus,
        duration: ep.duration,
        thumbnail: ep.thumbnail,
      };
    }

    const found = fallbackStore.episodes.find((ep) => ep.id === episodeId || ep._id === episodeId);
    return found || null;
  }

  /**
   * Administrative Seeding: seeds verified catalogue into MongoDB if connected,
   * or resets the in-memory fallback.
   */
  static async seedInitialData(): Promise<{ success: boolean; message: string; count: number }> {
    const conn = await connectToDatabase();
    if (conn && isDbConnected()) {
      try {
        // Clear old test data or check existing
        await Anime.deleteMany({});
        await AnimeVersion.deleteMany({});
        await Episode.deleteMany({});
        await SourceChannel.deleteMany({});

        // 1. Insert Channels
        const channelMap = new Map<string, string>();
        for (const ch of SEED_CHANNELS) {
          const doc = await SourceChannel.create({
            channelId: ch.channelId,
            channelName: ch.channelName,
            officialSourceVerificationStatus: ch.officialSourceVerificationStatus,
            isEnabled: ch.isEnabled,
            customUrl: ch.customUrl,
            description: ch.description,
            lastImportAt: new Date(),
          });
          channelMap.set(ch.id || ch.channelId, doc._id.toString());
        }

        // 2. Insert Anime
        const animeMap = new Map<string, string>();
        for (const a of SEED_ANIME) {
          const doc = await Anime.create({
            title: a.title,
            slug: a.slug,
            synopsis: a.synopsis,
            poster: a.poster,
            backdrop: a.backdrop,
            genres: a.genres,
            releaseYear: a.releaseYear,
            status: a.status,
            isFeatured: a.isFeatured,
            popularityScore: a.popularityScore,
          });
          animeMap.set(a.id || a.slug, doc._id.toString());
        }

        // 3. Insert Versions
        const versionMap = new Map<string, string>();
        for (const v of SEED_VERSIONS) {
          const animeDbId = animeMap.get(v.anime);
          if (!animeDbId) continue;

          const sourceDbId = v.sourceChannel ? channelMap.get(v.sourceChannel) : undefined;

          const doc = await AnimeVersion.create({
            anime: animeDbId,
            audioLanguage: v.audioLanguage,
            subtitleLanguages: v.subtitleLanguages,
            sourceChannel: sourceDbId,
            channelName: v.channelName,
            verificationStatus: v.verificationStatus,
          });
          versionMap.set(v.id || '', doc._id.toString());
        }

        // 4. Insert Episodes
        let epCount = 0;
        for (const ep of SEED_EPISODES) {
          const animeDbId = animeMap.get(ep.anime);
          const versionDbId = versionMap.get(ep.version);
          if (!animeDbId || !versionDbId) continue;

          await Episode.create({
            anime: animeDbId,
            version: versionDbId,
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            youtubeVideoId: ep.youtubeVideoId,
            playlistId: ep.playlistId,
            publicationDate: ep.publicationDate ? new Date(ep.publicationDate) : new Date(),
            verificationStatus: ep.verificationStatus,
            duration: ep.duration,
            thumbnail: ep.thumbnail,
          });
          epCount++;
        }

        return {
          success: true,
          message: `Successfully seeded MongoDB with ${SEED_ANIME.length} anime and ${epCount} verified episodes!`,
          count: SEED_ANIME.length,
        };
      } catch (err) {
        console.error('Seeding MongoDB error:', err);
        return {
          success: false,
          message: `Database seeding encountered an error: ${(err as Error).message}`,
          count: 0,
        };
      }
    }

    // In-memory fallback reset
    fallbackStore.anime = [...SEED_ANIME];
    fallbackStore.versions = [...SEED_VERSIONS];
    fallbackStore.episodes = [...SEED_EPISODES];
    fallbackStore.channels = [...SEED_CHANNELS];

    return {
      success: true,
      message: `Initial verified catalogue loaded into in-memory store (${fallbackStore.anime.length} anime, ${fallbackStore.episodes.length} episodes).`,
      count: fallbackStore.anime.length,
    };
  }

  /**
   * Admin: Add or update anime
   */
  static async upsertAnime(data: Partial<IAnime>): Promise<IAnime> {
    const useDb = await this.ensureDb();
    if (useDb) {
      if (data.id || data._id) {
        const updated = await Anime.findByIdAndUpdate(data.id || data._id, data, { new: true });
        if (updated) {
          return {
            id: updated._id.toString(),
            title: updated.title,
            slug: updated.slug,
            synopsis: updated.synopsis,
            poster: updated.poster,
            backdrop: updated.backdrop,
            genres: updated.genres,
            releaseYear: updated.releaseYear,
            status: updated.status,
            isFeatured: updated.isFeatured,
            popularityScore: updated.popularityScore,
          };
        }
      }
      const created = await Anime.create({
        ...data,
        slug: data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      });
      return {
        id: created._id.toString(),
        title: created.title,
        slug: created.slug,
        synopsis: created.synopsis,
        poster: created.poster,
        backdrop: created.backdrop,
        genres: created.genres,
        releaseYear: created.releaseYear,
        status: created.status,
        isFeatured: created.isFeatured,
        popularityScore: created.popularityScore,
      };
    }

    // In-memory fallback
    const id = data.id || data._id || `anime-${Date.now()}`;
    const slug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'anime';
    const entry: IAnime = {
      id,
      title: data.title || 'Untitled Anime',
      slug,
      synopsis: data.synopsis || '',
      poster: data.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
      backdrop: data.backdrop,
      genres: data.genres || ['Action'],
      releaseYear: data.releaseYear || new Date().getFullYear(),
      status: data.status || 'Ongoing',
      isFeatured: !!data.isFeatured,
      popularityScore: data.popularityScore || 50,
      createdAt: new Date().toISOString(),
    };

    const idx = fallbackStore.anime.findIndex((a) => a.id === id || a.slug === slug);
    if (idx >= 0) {
      fallbackStore.anime[idx] = { ...fallbackStore.anime[idx], ...entry };
    } else {
      fallbackStore.anime.unshift(entry);
    }
    return entry;
  }

  /**
   * Admin: Add an episode (defaults to unverified until reviewed)
   */
  static async addEpisode(data: {
    animeId: string;
    versionId: string;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    youtubeVideoId: string;
    playlistId?: string;
    verificationStatus?: VerificationStatus;
    duration?: string;
    thumbnail?: string;
  }): Promise<IEpisode> {
    const useDb = await this.ensureDb();
    if (useDb) {
      const ep = await Episode.create({
        anime: data.animeId,
        version: data.versionId,
        seasonNumber: data.seasonNumber,
        episodeNumber: data.episodeNumber,
        title: data.title,
        youtubeVideoId: data.youtubeVideoId,
        playlistId: data.playlistId,
        verificationStatus: data.verificationStatus || 'unverified',
        duration: data.duration,
        thumbnail:
          data.thumbnail ||
          `https://img.youtube.com/vi/${data.youtubeVideoId}/hqdefault.jpg`,
      });
      return {
        id: ep._id.toString(),
        anime: ep.anime.toString(),
        version: ep.version.toString(),
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        youtubeVideoId: ep.youtubeVideoId,
        playlistId: ep.playlistId,
        verificationStatus: ep.verificationStatus,
        duration: ep.duration,
        thumbnail: ep.thumbnail,
      };
    }

    const id = `ep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEp: IEpisode = {
      id,
      anime: data.animeId,
      version: data.versionId,
      seasonNumber: data.seasonNumber,
      episodeNumber: data.episodeNumber,
      title: data.title,
      youtubeVideoId: data.youtubeVideoId,
      playlistId: data.playlistId,
      verificationStatus: data.verificationStatus || 'unverified',
      duration: data.duration || '24:00',
      thumbnail:
        data.thumbnail ||
        `https://img.youtube.com/vi/${data.youtubeVideoId}/hqdefault.jpg`,
      createdAt: new Date().toISOString(),
    };
    fallbackStore.episodes.push(newEp);
    return newEp;
  }

  /**
   * Admin: Toggle verification status for an episode or version
   */
  static async updateVerificationStatus(
    type: 'episode' | 'version',
    id: string,
    status: VerificationStatus
  ): Promise<boolean> {
    const useDb = await this.ensureDb();
    if (useDb) {
      if (type === 'episode') {
        const res = await Episode.findByIdAndUpdate(id, { verificationStatus: status });
        return !!res;
      } else {
        const res = await AnimeVersion.findByIdAndUpdate(id, { verificationStatus: status });
        return !!res;
      }
    }

    if (type === 'episode') {
      const ep = fallbackStore.episodes.find((e) => e.id === id || e._id === id);
      if (ep) {
        ep.verificationStatus = status;
        return true;
      }
    } else {
      const ver = fallbackStore.versions.find((v) => v.id === id || v._id === id);
      if (ver) {
        ver.verificationStatus = status;
        return true;
      }
    }
    return false;
  }

  /**
   * Admin: Get all items for review (including unverified and unavailable)
   */
  static async getAdminOverview(): Promise<{
    anime: IAnime[];
    versions: IAnimeVersion[];
    episodes: IEpisode[];
    channels: ISourceChannel[];
  }> {
    const useDb = await this.ensureDb();
    if (useDb) {
      const [animeDocs, versionDocs, epDocs, chDocs] = await Promise.all([
        Anime.find({}).sort({ createdAt: -1 }).lean(),
        AnimeVersion.find({}).lean(),
        Episode.find({}).sort({ createdAt: -1 }).limit(100).lean(),
        SourceChannel.find({}).lean(),
      ]);

      return {
        anime: animeDocs.map((a: any) => ({ ...a, id: a._id.toString(), _id: a._id.toString() })) as IAnime[],
        versions: versionDocs.map((v: any) => ({ ...v, id: v._id.toString(), _id: v._id.toString() })) as IAnimeVersion[],
        episodes: epDocs.map((e: any) => ({ ...e, id: e._id.toString(), _id: e._id.toString() })) as IEpisode[],
        channels: chDocs.map((c: any) => ({ ...c, id: c._id.toString(), _id: c._id.toString() })) as ISourceChannel[],
      };
    }

    return {
      anime: [...fallbackStore.anime],
      versions: [...fallbackStore.versions],
      episodes: [...fallbackStore.episodes],
      channels: [...fallbackStore.channels],
    };
  }
}
