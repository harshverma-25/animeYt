import { NextRequest, NextResponse } from 'next/server';
import { CatalogueService } from '@/lib/services/catalogueService';
import { CatalogueQueryParams } from '@/types/anime';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || undefined;
    const audioLanguage = searchParams.get('audio') || undefined;
    const subtitleLanguage = searchParams.get('sub') || undefined;
    const genre = searchParams.get('genre') || undefined;
    const sortBy = (searchParams.get('sort') as CatalogueQueryParams['sortBy']) || 'popular';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const result = await CatalogueService.getCatalogue({
      query,
      audioLanguage,
      subtitleLanguage,
      genre,
      sortBy,
      page,
      limit,
    });

    const [genres, audioLanguages] = await Promise.all([
      CatalogueService.getGenres(),
      CatalogueService.getAudioLanguages(),
    ]);

    return NextResponse.json({
      success: true,
      data: result,
      filters: {
        genres,
        audioLanguages,
      },
    });
  } catch (error) {
    console.error('API /api/catalogue error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch anime catalogue',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
