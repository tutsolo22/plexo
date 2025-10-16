import { NextRequest } from 'next/server';
import { vectorSearchService } from '@/lib/ai/vector-search';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/middleware/auth';
import { withErrorHandling } from '@/lib/api/middleware/error-handling';
import { ApiResponses } from '@/lib/api/responses';

// POST /api/ai/indexing/reindex - Re-indexar todo el contenido
export const POST = withErrorHandling(
  withAuth(['admin'])(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action') || 'full';

        switch (action) {
          case 'full':
            // Re-indexación completa
            await vectorSearchService.reindexAll();
            return ApiResponses.success({
              message: 'Re-indexación completa iniciada',
              action: 'reindex_all',
              timestamp: new Date().toISOString(),
            });

          case 'events':
            // Re-indexar solo eventos
            const events = await prisma.event.findMany({ select: { id: true } });
            for (const event of events) {
              await vectorSearchService.indexEvent(event.id);
            }
            return ApiResponses.success({
              message: `${events.length} eventos re-indexados`,
              action: 'reindex_events',
              count: events.length,
            });

          case 'clients':
            // Re-indexar solo clientes
            const clients = await prisma.client.findMany({ select: { id: true } });
            for (const client of clients) {
              await vectorSearchService.indexClient(client.id);
            }
            return ApiResponses.success({
              message: `${clients.length} clientes re-indexados`,
              action: 'reindex_clients',
              count: clients.length,
            });

          case 'venues':
            // Re-indexar solo venues
            const venues = await prisma.venue.findMany({ select: { id: true } });
            for (const venue of venues) {
              await vectorSearchService.indexVenue(venue.id);
            }
            return ApiResponses.success({
              message: `${venues.length} venues re-indexados`,
              action: 'reindex_venues',
              count: venues.length,
            });

          default:
            return ApiResponses.badRequest('Acción no válida. Use: full, events, clients, venues');
        }

      } catch (error) {
        console.error('Error en re-indexación:', error);
        return ApiResponses.internalError('Error durante la re-indexación');
      }
    }
  )
);

// PUT /api/ai/indexing/event/{id} - Indexar evento específico
export const PUT = withErrorHandling(
  withAuth(['admin', 'manager'])(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const entityType = searchParams.get('type');
        const entityId = searchParams.get('id');

        if (!entityType || !entityId) {
          return ApiResponses.badRequest('Se requieren los parámetros type y id');
        }

        switch (entityType) {
          case 'event':
            await vectorSearchService.indexEvent(entityId);
            break;
          case 'client':
            await vectorSearchService.indexClient(entityId);
            break;
          case 'venue':
            await vectorSearchService.indexVenue(entityId);
            break;
          default:
            return ApiResponses.badRequest('Tipo de entidad no válido. Use: event, client, venue');
        }

        return ApiResponses.success({
          message: `${entityType} ${entityId} indexado correctamente`,
          entityType,
          entityId,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error('Error indexando entidad:', error);
        return ApiResponses.internalError('Error indexando entidad');
      }
    }
  )
);

// GET /api/ai/indexing/status - Obtener estado de indexación
export const GET = withErrorHandling(
  withAuth(['admin', 'manager'])(
    async (_req: NextRequest) => {
      try {
        // Obtener estadísticas de embeddings
        const totalEmbeddings = await prisma.contentEmbedding.count();
        
        const embeddingsByType = await prisma.contentEmbedding.groupBy({
          by: ['entityType'],
          _count: {
            id: true
          }
        });

        const stats = embeddingsByType.reduce((acc, item) => {
          acc[item.entityType] = item._count.id;
          return acc;
        }, {} as Record<string, number>);

        // Obtener totales de entidades
        const [totalEvents, totalClients, totalVenues] = await Promise.all([
          prisma.event.count(),
          prisma.client.count(),
          prisma.venue.count(),
        ]);

        const indexingStatus = {
          total: totalEmbeddings,
          byType: stats,
          coverage: {
            events: {
              indexed: stats.event || 0,
              total: totalEvents,
              percentage: totalEvents > 0 ? Math.round((stats.event || 0) / totalEvents * 100) : 0
            },
            clients: {
              indexed: stats.client || 0,
              total: totalClients,
              percentage: totalClients > 0 ? Math.round((stats.client || 0) / totalClients * 100) : 0
            },
            venues: {
              indexed: stats.venue || 0,
              total: totalVenues,
              percentage: totalVenues > 0 ? Math.round((stats.venue || 0) / totalVenues * 100) : 0
            }
          },
          lastUpdated: new Date().toISOString()
        };

        return ApiResponses.success(indexingStatus);

      } catch (error) {
        console.error('Error obteniendo estado de indexación:', error);
        return ApiResponses.internalError('Error obteniendo estado');
      }
    }
  )
);