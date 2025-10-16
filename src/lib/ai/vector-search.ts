import { prisma } from '@/lib/prisma';
import { embeddingService, SearchResult } from './embeddings';

export interface VectorSearchOptions {
  type?: 'event' | 'client' | 'quote' | 'venue' | undefined;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

export interface StoreEmbeddingOptions {
  id: string;
  content: string;
  type: 'event' | 'client' | 'quote' | 'venue';
  metadata?: Record<string, any>;
  entityId: string; // ID de la entidad original (evento, cliente, etc.)
}

export class VectorSearchService {
  /**
   * Almacena un embedding en la base de datos
   */
  async storeEmbedding(options: StoreEmbeddingOptions): Promise<void> {
    try {
      const { embedding } = await embeddingService.generateEmbedding(options.content);
      
      await prisma.contentEmbedding.upsert({
        where: { id: options.id },
        update: {
          content: options.content,
          embedding: embedding,
          metadata: options.metadata || {},
          updatedAt: new Date(),
        },
        create: {
          id: options.id,
          entityId: options.entityId,
          entityType: options.type,
          content: options.content,
          embedding: embedding,
          metadata: options.metadata || {},
        },
      });
    } catch (error) {
      console.error('Error almacenando embedding:', error);
      throw new Error('Failed to store embedding');
    }
  }

  /**
   * Realiza búsqueda semántica usando similitud coseno
   */
  async searchSimilar(
    query: string, 
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const { 
        type, 
        limit = 10, 
        threshold = 0.7,
        includeMetadata = true 
      } = options;

      // Generar embedding para la consulta
      const { embedding: queryEmbedding } = await embeddingService.generateEmbedding(query);

      // Construir la consulta SQL con pgvector
      const whereClause = type ? 'WHERE entity_type = $3' : '';
      const params = type ? [queryEmbedding, limit, type] : [queryEmbedding, limit];

      const sql = `
        SELECT 
          id,
          entity_id,
          entity_type,
          content,
          metadata,
          1 - (embedding <=> $1::vector) as similarity
        FROM content_embeddings
        ${whereClause}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

      const results = await prisma.$queryRawUnsafe(sql, ...params) as any[];

      // Filtrar por threshold y formatear resultados
      return results
        .filter(result => result.similarity >= threshold)
        .map(result => ({
          id: result.id,
          similarity: parseFloat(result.similarity),
          content: result.content,
          metadata: includeMetadata ? result.metadata : undefined,
          type: result.entity_type,
          entityId: result.entity_id,
        }));

    } catch (error) {
      console.error('Error en búsqueda vectorial:', error);
      throw new Error('Failed to perform vector search');
    }
  }

  /**
   * Indexa un evento para búsqueda semántica
   */
  async indexEvent(eventId: string): Promise<void> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          client: true,
          venue: true,
          eventType: true,
        },
      });

      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      const content = embeddingService.prepareTextForEmbedding({
        name: event.name,
        description: event.description,
        type: event.eventType?.name,
        location: event.venue?.name,
        date: event.eventDate,
        status: event.status,
        client: event.client?.name,
      });

      await this.storeEmbedding({
        id: `event-${eventId}`,
        entityId: eventId,
        type: 'event',
        content,
        metadata: {
          name: event.name,
          date: event.eventDate,
          status: event.status,
          clientName: event.client?.name,
          venueName: event.venue?.name,
          eventType: event.eventType?.name,
        },
      });
    } catch (error) {
      console.error(`Error indexando evento ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Indexa un cliente para búsqueda semántica
   */
  async indexClient(clientId: string): Promise<void> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          events: {
            include: {
              eventType: true,
            },
          },
        },
      });

      if (!client) {
        throw new Error(`Client ${clientId} not found`);
      }

      const eventTypes = [...new Set(client.events.map(e => e.eventType?.name).filter(Boolean))];
      
      const content = embeddingService.prepareTextForEmbedding({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        notes: client.notes,
        eventTypes: eventTypes.join(', '),
      });

      await this.storeEmbedding({
        id: `client-${clientId}`,
        entityId: clientId,
        type: 'client',
        content,
        metadata: {
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          eventCount: client.events.length,
          eventTypes,
        },
      });
    } catch (error) {
      console.error(`Error indexando cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Indexa un venue para búsqueda semántica
   */
  async indexVenue(venueId: string): Promise<void> {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
      });

      if (!venue) {
        throw new Error(`Venue ${venueId} not found`);
      }

      const content = embeddingService.prepareTextForEmbedding({
        name: venue.name,
        description: venue.description,
        location: venue.location,
        capacity: `Capacidad: ${venue.capacity} personas`,
        amenities: venue.amenities,
        type: venue.type,
      });

      await this.storeEmbedding({
        id: `venue-${venueId}`,
        entityId: venueId,
        type: 'venue',
        content,
        metadata: {
          name: venue.name,
          location: venue.location,
          capacity: venue.capacity,
          pricePerHour: venue.pricePerHour,
          type: venue.type,
          amenities: venue.amenities,
        },
      });
    } catch (error) {
      console.error(`Error indexando venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Re-indexa todo el contenido existente
   */
  async reindexAll(): Promise<void> {
    try {
      console.log('Iniciando re-indexación completa...');

      // Limpiar embeddings existentes
      await prisma.contentEmbedding.deleteMany();

      // Indexar eventos
      const events = await prisma.event.findMany({ select: { id: true } });
      for (const event of events) {
        await this.indexEvent(event.id);
      }

      // Indexar clientes
      const clients = await prisma.client.findMany({ select: { id: true } });
      for (const client of clients) {
        await this.indexClient(client.id);
      }

      // Indexar venues
      const venues = await prisma.venue.findMany({ select: { id: true } });
      for (const venue of venues) {
        await this.indexVenue(venue.id);
      }

      console.log(`Re-indexación completada: ${events.length} eventos, ${clients.length} clientes, ${venues.length} venues`);
    } catch (error) {
      console.error('Error en re-indexación:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const vectorSearchService = new VectorSearchService();