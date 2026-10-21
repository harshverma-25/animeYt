import { connectToDatabase } from '@/lib/db/mongodb';
import { Anime } from '@/lib/db/models/Anime';
import { AnimeVersion } from '@/lib/db/models/AnimeVersion';
import { Episode } from '@/lib/db/models/Episode';
import { SourceChannel } from '@/lib/db/models/SourceChannel';
import {
  IAnime,
  IAnimeVersion,
  IEpisode,
  ISourceChannel,
  AnimeWithDetails,
  CatalogueQueryParams,
  PaginatedResult,
  VerificationStatus,
} from '@/types/anime';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const catalogueCache = new Map<string, CacheEntry<any>>();
const animeDetailsCache = new Map<string, CacheEntry<any>>();
const animeEpisodesCache = new Map<string, CacheEntry<any>>();
const homePageCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const detailsInFlightRequests = new Map<string, Promise<any>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export class CatalogueService {
  /**
   * Clear in-memory catalogue, episode, and detail caches
   */
  static clearCache(): void {
    catalogueCache.clear();
    animeDetailsCache.clear();
    animeEpisodesCache.clear();
    homePageCache.clear();
    inFlightRequests.clear();
    detailsInFlightRequests.clear();
  }

  /**
   * Retrieve list of unique available genres across the catalogue
   */
  static async getGenres(): Promise<string[]> {
    await connectToDatabase();
    const genres = await Anime.distinct('genres');
    return (genres || []).filter(Boolean).sort();
  }

  /**
   * Retrieve list of unique available audio languages across verified versions
   */
  static async getAudioLanguages(): Promise<string[]> {
    await connectToDatabase();
    const languages = await AnimeVersion.distinct('audioLanguage', {
      verificationStatus: 'verified',
    });
    return (languages || []).filter(Boolean).sort();
  }

  /**
   * Search and filter anime from MongoDB
   */
  static getCatalogue(params: CatalogueQueryParams = {}): Promise<PaginatedResult<IAnime & { availableAudioLanguages: string[]; totalEpisodes: number }>> {
    const cacheKey = JSON.stringify(params || {});
    const cached = catalogueCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return Promise.resolve(cached.data);
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
      const mongoose = await connectToDatabase();

      if (!mongoose) {
        return {
          items: [],
          total: 0,
          page: params.page || 1,
          totalPages: 0,
          hasMore: false,
        };
      }

      const page = Math.max(1, params.page || 1);
      const limit = Math.max(1, Math.min(params.limit || 20, 100));
      const skip = (page - 1) * limit;

      const conditions: Record<string, any>[] = [];

      // Text / query search with safe escaped regex
      if (params.query && params.query.trim()) {
        const q = params.query.trim();
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        conditions.push({
          $or: [
            { title: { $regex: escaped, $options: 'i' } },
            { englishTitle: { $regex: escaped, $options: 'i' } },
            { romajiTitle: { $regex: escaped, $options: 'i' } },
            { slug: { $regex: escaped.toLowerCase(), $options: 'i' } },
            { genres: { $regex: `^${escaped}$`, $options: 'i' } },
          ],
        });
      }

      // Genre filter
      if (params.genre && params.genre.toLowerCase() !== 'all') {
        conditions.push({ genres: { $regex: new RegExp(`^${params.genre}$`, 'i') } });
      }

      // Verified only filter
      if (params.verifiedOnly) {
        conditions.push({ verifiedEpisodeCount: { $gt: 0 } });
      }

      // Specific IDs or Slugs filter (for batch watchlist retrieval)
      if (params.ids && params.ids.length > 0) {
        const validObjectIds = params.ids
          .filter((id) => mongoose.Types.ObjectId.isValid(id) && id.length === 24)
          .map((id) => new mongoose.Types.ObjectId(id));
        const slugs = params.ids.map((id) => id.toLowerCase());

        conditions.push({
          $or: [
            ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
            { slug: { $in: slugs } },
          ],
        });
      }

      // Audio language filter: query verified versions directly in DB before pagination using covered index
      if (params.audioLanguage && params.audioLanguage.toLowerCase() !== 'all') {
        const langParam = params.audioLanguage.trim();
        const langNorm = langParam.charAt(0).toUpperCase() + langParam.slice(1).toLowerCase();
        const matchingAnimeIds = await AnimeVersion.distinct('anime', {
          audioLanguage: { $in: [langNorm, langParam] },
          verificationStatus: 'verified',
        });
        conditions.push({ _id: { $in: matchingAnimeIds } });
      }

      const query =
        conditions.length === 0
          ? {}
          : conditions.length === 1
          ? conditions[0]
          : { $and: conditions };

      // Sort options
      let sortObj: Record<string, 1 | -1> = { popularityScore: -1, createdAt: -1 };
      if (params.sortBy === 'recent') {
        sortObj = { releaseYear: -1, createdAt: -1 };
      } else if (params.sortBy === 'title') {
        sortObj = { title: 1 };
      } else if (params.sortBy === 'year') {
        sortObj = { releaseYear: -1 };
      }

      const [animeDocs, total] = await Promise.all([
        Anime.find(query)
          .select('_id title englishTitle romajiTitle slug synopsis poster backdrop genres releaseYear status isFeatured popularityScore verifiedEpisodeCount')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Anime.countDocuments(query),
      ]);

      // Attach verified audio languages using lean covered index projection
      const animeIds = animeDocs.map((a: any) => a._id);
      const versions = animeIds.length > 0
        ? await AnimeVersion.find({
            anime: { $in: animeIds },
            verificationStatus: 'verified',
          })
            .select('_id anime audioLanguage')
            .lean()
        : [];

      const items = animeDocs.map((anime: any) => {
        const animeVersions = versions.filter((v: any) => v.anime.toString() === anime._id.toString());
        const availableAudioLanguages = Array.from(new Set(animeVersions.map((v: any) => v.audioLanguage as string)));

        return {
          ...anime,
          _id: anime._id.toString(),
          id: anime._id.toString(),
          availableAudioLanguages,
          totalEpisodes: anime.verifiedEpisodeCount || 0,
        };
      });

      const totalPages = Math.ceil(total / limit);

      const result = {
        items,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      };

      catalogueCache.set(cacheKey, { data: result, expiry: Date.now() + DEFAULT_TTL_MS });
      return result;
    })().finally(() => {
      inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Get single anime details by slug or ID with ONLY verified published episodes
   */
  static getAnimeBySlug(slugOrId: string): Promise<AnimeWithDetails | null> {
    const cacheKey = slugOrId.toLowerCase();
    const cached = animeDetailsCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return Promise.resolve(cached.data);
    }

    if (detailsInFlightRequests.has(cacheKey)) {
      return detailsInFlightRequests.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
      const mongoose = await connectToDatabase();
      if (!mongoose) return null;

      const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId) && slugOrId.length === 24;
      const isNumeric = /^\d+$/.test(slugOrId);

      const query: any = isObjectId
        ? { _id: slugOrId }
        : isNumeric
        ? { anilistId: parseInt(slugOrId, 10) }
        : { slug: slugOrId.toLowerCase() };

      const anime: any = await Anime.findOne(query).lean();
      if (!anime) return null;

      // Fetch versions and ONLY published, verified episodes in PARALLEL with lean field projection
      const [versions, episodes] = await Promise.all([
        AnimeVersion.find({
          anime: anime._id,
          verificationStatus: 'verified',
        }).lean(),
        Episode.find({
          anime: anime._id,
          isPublished: true,
          verificationStatus: 'verified',
        })
          .select('_id version seasonNumber episodeNumber title youtubeVideoId duration thumbnail sourceChannelName isPublished verificationStatus')
          .sort({ seasonNumber: 1, episodeNumber: 1 })
          .lean(),
      ]);

      const episodesByVersion = new Map<string, any[]>();
      for (const ep of episodes) {
        const vId = ep.version.toString();
        let list = episodesByVersion.get(vId);
        if (!list) {
          list = [];
          episodesByVersion.set(vId, list);
        }
        list.push({
          id: ep._id.toString(),
          _id: ep._id.toString(),
          version: vId,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          youtubeVideoId: ep.youtubeVideoId,
          duration: ep.duration || '24:00',
          thumbnail: ep.thumbnail,
          sourceChannelName: ep.sourceChannelName,
          isPublished: true,
          verificationStatus: ep.verificationStatus,
        });
      }

      const versionsWithEpisodes = versions.map((v) => ({
        ...v,
        id: v._id.toString(),
        _id: v._id.toString(),
        episodes: episodesByVersion.get(v._id.toString()) || [],
      }));

      const availableAudioLanguages = Array.from(
        new Set(versionsWithEpisodes.map((v) => v.audioLanguage as string))
      );

      const result = {
        ...anime,
        _id: anime._id.toString(),
        id: anime._id.toString(),
        versions: versionsWithEpisodes,
        availableAudioLanguages,
        totalEpisodes: episodes.length,
      };

      animeDetailsCache.set(cacheKey, { data: result, expiry: Date.now() + DEFAULT_TTL_MS });
      return result;
    })().finally(() => {
      detailsInFlightRequests.delete(cacheKey);
    });

    detailsInFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Get ONLY verified, published episodes for a given anime slug or ID
   */
  static async getEpisodesForAnime(
    slugOrId: string,
    options: { audioLanguage?: string; seasonNumber?: number } = {}
  ): Promise<any[]> {
    const cacheKey = `${slugOrId.toLowerCase()}_${JSON.stringify(options || {})}`;
    const cached = animeEpisodesCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const mongoose = await connectToDatabase();
    if (!mongoose) return [];

    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId) && slugOrId.length === 24;
    const isNumeric = /^\d+$/.test(slugOrId);

    const animeQuery: any = {
      $or: [
        { slug: slugOrId.toLowerCase() },
        ...(isObjectId ? [{ _id: slugOrId }] : []),
        ...(isNumeric ? [{ anilistId: parseInt(slugOrId, 10) }] : []),
      ],
    };

    const anime: any = await Anime.findOne(animeQuery).lean();
    if (!anime) return [];

    const versionQuery: any = {
      anime: anime._id,
      verificationStatus: 'verified',
    };
    if (options.audioLanguage && options.audioLanguage.toLowerCase() !== 'all') {
      versionQuery.audioLanguage = { $regex: new RegExp(`^${options.audioLanguage}$`, 'i') };
    }

    const versions: any[] = await AnimeVersion.find(versionQuery).lean();
    const versionIds = versions.map((v) => v._id);

    const epQuery: any = {
      anime: anime._id,
      version: { $in: versionIds },
      isPublished: true,
      verificationStatus: 'verified',
    };
    if (options.seasonNumber) {
      epQuery.seasonNumber = options.seasonNumber;
    }

    const episodes: any[] = await Episode.find(epQuery)
      .sort({ seasonNumber: 1, episodeNumber: 1 })
      .lean();

    const result = episodes.map((ep) => {
      const ver = versions.find((v) => v._id.toString() === ep.version.toString());
      return {
        id: ep._id.toString(),
        animeId: anime._id.toString(),
        animeSlug: anime.slug,
        versionId: ep.version.toString(),
        audioLanguage: ver?.audioLanguage || 'Japanese',
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        youtubeVideoId: ep.youtubeVideoId,
        playlistId: ep.playlistId,
        duration: ep.duration || '24:00',
        thumbnail: ep.thumbnail,
        sourceChannelName: ep.sourceChannelName || ver?.channelName,
        isPublished: true,
        verificationStatus: ep.verificationStatus,
      };
    });

    animeEpisodesCache.set(cacheKey, { data: result, expiry: Date.now() + DEFAULT_TTL_MS });
    return result;
  }

  /**
   * Get home page dataset: Featured, Popular, and Recently Added based on real MongoDB records
   */
  static async getHomePageData(): Promise<{
    featured: (IAnime & { availableAudioLanguages: string[]; totalEpisodes: number })[];
    popular: (IAnime & { availableAudioLanguages: string[]; totalEpisodes: number })[];
    recentlyAdded: (IAnime & { availableAudioLanguages: string[]; totalEpisodes: number })[];
  }> {
    const cacheKey = 'home_page_data';
    const cached = homePageCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const mongoose = await connectToDatabase();
    if (!mongoose) {
      return { featured: [], popular: [], recentlyAdded: [] };
    }

    const homeSelect =
      '_id title englishTitle romajiTitle slug synopsis poster backdrop genres releaseYear status isFeatured popularityScore verifiedEpisodeCount';

    const [featuredDocs, popularDocs, recentDocs] = await Promise.all([
      // Featured: marked featured or top with verified episodes
      Anime.find({ $or: [{ isFeatured: true }, { verifiedEpisodeCount: { $gt: 0 } }] })
        .select(homeSelect)
        .sort({ isFeatured: -1, popularityScore: -1 })
        .limit(5)
        .lean(),
      // Popular: sorted by popularity score and creation date matching compound index
      Anime.find({})
        .select(homeSelect)
        .sort({ popularityScore: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      // Recently added: sorted by createdAt and releaseYear matching compound index
      Anime.find({})
        .select(homeSelect)
        .sort({ createdAt: -1, releaseYear: -1 })
        .limit(5)
        .lean(),
    ]);

    const allIds = Array.from(
      new Set([...featuredDocs, ...popularDocs, ...recentDocs].map((a: any) => a._id))
    );

    const versions = allIds.length > 0
      ? await AnimeVersion.find({
          anime: { $in: allIds },
          verificationStatus: 'verified',
        })
          .select('_id anime audioLanguage')
          .lean()
      : [];

    const mapAnime = (animeList: any[]) =>
      animeList.map((a: any) => {
        const aVersions = versions.filter((v: any) => v.anime.toString() === a._id.toString());
        return {
          ...a,
          _id: a._id.toString(),
          id: a._id.toString(),
          availableAudioLanguages: Array.from(new Set(aVersions.map((v: any) => v.audioLanguage as string))),
          totalEpisodes: a.verifiedEpisodeCount || 0,
        };
      });

    const result = {
      featured: mapAnime(featuredDocs.length > 0 ? featuredDocs : popularDocs.slice(0, 1)),
      popular: mapAnime(popularDocs),
      recentlyAdded: mapAnime(recentDocs),
    };

    homePageCache.set(cacheKey, { data: result, expiry: Date.now() + DEFAULT_TTL_MS });
    return result;
  }

  /**
   * Upsert anime document
   */
  static async upsertAnime(data: Partial<IAnime> & { [key: string]: any }): Promise<any> {
    await connectToDatabase();
    this.clearCache();
    const slug = data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined);
    
    if (data.id || data._id) {
      const updated = await Anime.findByIdAndUpdate(data.id || data._id, { $set: data }, { returnDocument: 'after' });
      if (updated) return updated;
    }

    if (slug) {
      return Anime.findOneAndUpdate(
        { slug },
        { $set: { ...data, slug } },
        { upsert: true, returnDocument: 'after' }
      );
    }

    return Anime.create(data);
  }

  /**
   * Overview statistics for admin panel
   */
  static async getAdminOverview(): Promise<{
    anime: IAnime[];
    versions: IAnimeVersion[];
    episodes: IEpisode[];
    channels: ISourceChannel[];
  }> {
    await connectToDatabase();
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

  /**
   * Seed initial authorized channels into MongoDB (no fake anime)
   */
  static async seedInitialData(): Promise<{ success: boolean; message: string; count: number }> {
    await connectToDatabase();
    const defaultChannels = [
      {
        channelId: 'UCGbshtvS9t-8CW11QD7NPxA',
        channelName: 'Muse Asia',
        officialSourceVerificationStatus: 'verified',
        isEnabled: true,
        customUrl: 'https://www.youtube.com/@MuseAsia',
      },
      {
        channelId: 'UCxghD4vYvwh4_Q8W6N6Ygvg',
        channelName: 'Muse India',
        officialSourceVerificationStatus: 'verified',
        isEnabled: true,
        customUrl: 'https://www.youtube.com/@MuseIndia',
      },
      {
        channelId: 'UC0wNSTMWIL3qaorLx0jie6A',
        channelName: 'Ani-One Asia',
        officialSourceVerificationStatus: 'verified',
        isEnabled: true,
        customUrl: 'https://www.youtube.com/@AniOneAsia',
      },
    ];

    let count = 0;
    for (const ch of defaultChannels) {
      await SourceChannel.findOneAndUpdate(
        { channelId: ch.channelId },
        { $setOnInsert: ch },
        { upsert: true }
      );
      count++;
    }

    return {
      success: true,
      message: `Seeded ${count} official channels. Use AniList Import to populate real catalogue metadata.`,
      count,
    };
  }

  /**
   * Add episode document
   */
  static async addEpisode(data: {
    animeId: string;
    versionId: string;
    seasonNumber?: number;
    episodeNumber: number;
    title: string;
    youtubeVideoId: string;
    playlistId?: string;
    verificationStatus?: VerificationStatus;
    duration?: string;
    thumbnail?: string;
  }): Promise<any> {
    await connectToDatabase();
    const isVerified = data.verificationStatus === 'verified';
    const ep = await Episode.create({
      anime: data.animeId,
      version: data.versionId,
      seasonNumber: data.seasonNumber || 1,
      episodeNumber: data.episodeNumber,
      title: data.title,
      youtubeVideoId: data.youtubeVideoId,
      playlistId: data.playlistId,
      verificationStatus: (data.verificationStatus as VerificationStatus) || 'unverified',
      isPublished: isVerified,
      duration: data.duration,
      thumbnail: data.thumbnail,
    });

    if (isVerified) {
      const count = await Episode.countDocuments({
        anime: data.animeId,
        verificationStatus: 'verified',
        isPublished: true,
      });
      await Anime.updateOne({ _id: data.animeId }, { $set: { verifiedEpisodeCount: count } });
    }

    this.clearCache();
    return ep;
  }

  /**
   * Update verification status (admin helper)
   */
  static async updateVerificationStatus(
    entityType: 'episode' | 'version' | 'channel',
    id: string,
    status: 'verified' | 'unverified' | 'unavailable' | 'rejected'
  ): Promise<boolean> {
    await connectToDatabase();
    this.clearCache();
    if (entityType === 'episode') {
      const isPublished = status === 'verified';
      const updated = await Episode.findByIdAndUpdate(id, {
        $set: { verificationStatus: status, isPublished, verifiedAt: new Date() },
      });
      if (updated && updated.anime) {
        const count = await Episode.countDocuments({
          anime: updated.anime,
          verificationStatus: 'verified',
          isPublished: true,
        });
        await Anime.updateOne({ _id: updated.anime }, { $set: { verifiedEpisodeCount: count } });
      }
      return !!updated;
    } else if (entityType === 'version') {
      const updated = await AnimeVersion.findByIdAndUpdate(id, {
        $set: { verificationStatus: status, verifiedAt: new Date() },
      });
      return !!updated;
    } else if (entityType === 'channel') {
      const updated = await SourceChannel.findByIdAndUpdate(id, {
        $set: { officialSourceVerificationStatus: status },
      });
      return !!updated;
    }
    return false;
  }
}
