import { NextRequest } from 'next/server';
// Use lazy imports to avoid initializing Prisma at module load time
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withErrorHandling } from '@/lib/api/middleware/error-handling';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

// Schema de validación para búsqueda semántica
const searchRequestSchema = z.object({
  query: z.string().min(1, 'La consulta no puede estar vacía').max(500, 'La consulta es demasiado larga'),
  type: z.enum(['event', 'client', 'quote', 'venue']).optional(),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  includeMetadata: z.boolean().default(true),
});

async function searchHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, type, limit, threshold, includeMetadata } = searchRequestSchema.parse(body);

    // Realizar búsqueda semántica
    const vs = await import('@/lib/ai/vector-search');
    const results = await vs.vectorSearchService.searchSimilar(query, {
      type,
      limit,
      threshold,
      includeMetadata,
    });

    return ApiResponses.success({
      query,
      results,
      count: results.length,
      searchType: 'semantic',
      threshold,
    });

  } catch (error) {
    console.error('Error en búsqueda AI:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest('Datos de entrada inválidos', error.errors);
    }

    return ApiResponses.internalError('Error realizando búsqueda semántica');
  }
}

// POST /api/ai/search - Búsqueda semántica
export const POST = withErrorHandling(
  withAuth(['admin', 'manager', 'operator'])(
    withValidation(searchRequestSchema)(
      searchHandler
    )
  )
);

// GET /api/ai/search?q=consulta&type=event&limit=10 - Búsqueda rápida
export const GET = withErrorHandling(
  withAuth(['admin', 'manager', 'operator'])(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type') as 'event' | 'client' | 'quote' | 'venue' | undefined;
        const limit = parseInt(searchParams.get('limit') || '10');
        const threshold = parseFloat(searchParams.get('threshold') || '0.7');

        if (!query) {
          return ApiResponses.badRequest('Se requiere el parámetro q (query)');
        }

        if (query.length > 500) {
          return ApiResponses.badRequest('La consulta es demasiado larga');
        }

        const vs = await import('@/lib/ai/vector-search');
        const results = await vs.vectorSearchService.searchSimilar(query, {
          type,
          limit: Math.min(limit, 50),
          threshold: Math.max(0, Math.min(threshold, 1)),
          includeMetadata: true,
        });

        return ApiResponses.success({
          query,
          results,
          count: results.length,
          searchType: 'semantic',
          threshold,
        });

      } catch (error) {
        console.error('Error en búsqueda rápida AI:', error);
        return ApiResponses.internalError('Error realizando búsqueda');
      }
    }
  )
);