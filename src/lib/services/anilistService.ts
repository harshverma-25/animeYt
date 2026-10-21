import { connectToDatabase } from '@/lib/db/mongodb';
import { Anime } from '@/lib/db/models/Anime';
import { ImportJob } from '@/lib/db/models/ImportJob';
import { AnimeStatus } from '@/types/anime';

interface AniListMedia {
  id: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  description?: string;
  format?: string;
  status?: string;
  episodes?: number;
  seasonYear?: number;
  startDate?: {
    year?: number;
  };
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  bannerImage?: string;
  genres?: string[];
  averageScore?: number;
  popularity?: number;
}

interface AniListResponse {
  data?: {
    Page?: {
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
      media: AniListMedia[];
    };
  };
  errors?: Array<{ message: string }>;
}

export interface AniListImportOptions {
  page?: number;
  perPage?: number;
  maxPages?: number;
  search?: string;
  genre?: string;
  sort?: string[];
}

export interface AniListImportResult {
  jobId: string;
  processedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  status: 'completed' | 'failed';
  errorSummary?: string;
}

const GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const ANILIST_QUERY = `
query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort]) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (type: ANIME, isAdult: false, search: $search, genre: $genre, sort: $sort) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      format
      status
      episodes
      seasonYear
      startDate {
        year
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
      genres
      averageScore
      popularity
    }
  }
}
`;

function cleanSynopsis(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/\n\n/g, ' ')
    .replace(/\[Written by MAL Rewrite\]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function generateSlug(title: string, id: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || `anime-${id}`;
}

function mapStatus(status?: string): AnimeStatus {
  switch (status) {
    case 'RELEASING':
      return 'Ongoing';
    case 'NOT_YET_RELEASED':
      return 'Upcoming';
    case 'FINISHED':
    case 'CANCELLED':
    default:
      return 'Completed';
  }
}

export class AniListService {
  /**
   * Fetch a single page from AniList GraphQL API with retries
   */
  static async fetchPage(
    page = 1,
    perPage = 25,
    search?: string,
    genre?: string,
    sort = ['POPULARITY_DESC']
  ): Promise<AniListResponse> {
    const variables: Record<string, unknown> = {
      page,
      perPage,
      sort,
    };
    if (search) variables.search = search;
    if (genre) variables.genre = genre;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            query: ANILIST_QUERY,
            variables,
          }),
        });

        if (res.status === 429) {
          // Rate limited by AniList, wait with backoff
          const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
          console.warn(`AniList 429 rate limit hit. Waiting ${retryAfter}s...`);
          await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
          continue;
        }

        if (!res.ok) {
          throw new Error(`AniList HTTP error: ${res.status} ${res.statusText}`);
        }

        const data: AniListResponse = await res.json();
        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].message);
        }

        return data;
      } catch (err) {
        if (attempts >= maxAttempts) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    throw new Error('AniList request failed after multiple attempts');
  }

  /**
   * Run paginated import and upsert into MongoDB
   */
  static async importCatalogue(options: AniListImportOptions = {}): Promise<AniListImportResult> {
    await connectToDatabase();

    const startPage = options.page || 1;
    const perPage = Math.min(options.perPage || 20, 50);
    const maxPages = options.maxPages || 1;

    // Create tracking job in DB
    const job = await ImportJob.create({
      dataSource: 'anilist',
      jobType: options.search ? `anilist_search_${options.search}` : 'anilist_catalogue_import',
      status: 'running',
      progress: 0,
      processedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      startedAt: new Date(),
    });

    let processedCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    const skippedCount = 0;
    let failedCount = 0;
    let lastError: string | undefined;

    try {
      for (let p = 0; p < maxPages; p++) {
        const currentPage = startPage + p;
        const resp = await this.fetchPage(
          currentPage,
          perPage,
          options.search,
          options.genre,
          options.sort
        );

        const mediaList = resp.data?.Page?.media || [];
        if (mediaList.length === 0) break;

        for (const media of mediaList) {
          processedCount++;
          try {
            const displayTitle =
              media.title.english || media.title.romaji || media.title.native || 'Untitled Anime';
            const baseSlug = generateSlug(displayTitle, media.id);

            // Check if anime already exists by anilistId or slug
            const existing = await Anime.findOne({
              $or: [{ anilistId: media.id }, { slug: baseSlug }],
            });

            const releaseYear =
              media.seasonYear || media.startDate?.year || new Date().getFullYear();
            const rating = media.averageScore
              ? (media.averageScore / 10).toFixed(1)
              : '8.0';

            const payload = {
              anilistId: media.id,
              title: displayTitle,
              englishTitle: media.title.english || '',
              romajiTitle: media.title.romaji || '',
              nativeTitle: media.title.native || '',
              synopsis: cleanSynopsis(media.description),
              poster:
                media.coverImage?.extraLarge ||
                media.coverImage?.large ||
                '',
              backdrop:
                media.bannerImage ||
                media.coverImage?.extraLarge ||
                '',
              genres: media.genres && media.genres.length > 0 ? media.genres : ['Action'],
              format: media.format || 'TV',
              releaseYear,
              status: mapStatus(media.status),
              popularityScore: media.popularity || 0,
              rating,
              externalMetadataSource: 'anilist',
              metadataLastSyncedAt: new Date(),
            };

            if (existing) {
              // Update metadata WITHOUT overwriting verifiedEpisodeCount or existing manual flags
              await Anime.updateOne(
                { _id: existing._id },
                {
                  $set: payload,
                }
              );
              updatedCount++;
            } else {
              // Insert new Anime with verifiedEpisodeCount: 0
              let finalSlug = baseSlug;
              const slugConflict = await Anime.findOne({ slug: finalSlug });
              if (slugConflict) {
                finalSlug = `${baseSlug}-${media.id}`;
              }

              await Anime.create({
                ...payload,
                slug: finalSlug,
                verifiedEpisodeCount: 0,
                isFeatured: false,
              });
              insertedCount++;
            }
          } catch (itemErr) {
            console.error(`Failed to upsert anime ${media.id}:`, itemErr);
            failedCount++;
          }
        }

        // Check if there is next page
        const hasNext = resp.data?.Page?.pageInfo?.hasNextPage;
        if (!hasNext) break;

        // Rate limit courtesy delay between batch pages
        if (p < maxPages - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      await ImportJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'completed',
            progress: 100,
            processedCount,
            insertedCount,
            updatedCount,
            skippedCount,
            failedCount,
            completedAt: new Date(),
          },
        }
      );

      return {
        jobId: job._id.toString(),
        processedCount,
        insertedCount,
        updatedCount,
        skippedCount,
        failedCount,
        status: 'completed',
      };
    } catch (err) {
      lastError = (err as Error).message;
      await ImportJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'failed',
            errorSummary: lastError,
            completedAt: new Date(),
          },
        }
      );

      return {
        jobId: job._id.toString(),
        processedCount,
        insertedCount,
        updatedCount,
        skippedCount,
        failedCount,
        status: 'failed',
        errorSummary: lastError,
      };
    }
  }
}
