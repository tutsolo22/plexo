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
  async searchSimilar(query: string, options: VectorSearchOptions = {}): Promise<SearchResult[]> {
    try {
      const { type, limit = 10, threshold = 0.7, includeMetadata = true } = options;

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

      const results = (await prisma.$queryRawUnsafe(sql, ...params)) as any[];

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
        },
      });

      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      const content = embeddingService.prepareTextForEmbedding({
        title: event.title,
        notes: event.notes,
        location: event.venue?.name,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        client: event.client?.name,
      });

      await this.storeEmbedding({
        id: `event-${eventId}`,
        entityId: eventId,
        type: 'event',
        content,
        metadata: {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          status: event.status,
          clientName: event.client?.name,
          venueName: event.venue?.name,
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
          events: true,
        },
      });

      if (!client) {
        throw new Error(`Client ${clientId} not found`);
      }

      const content = embeddingService.prepareTextForEmbedding({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        notes: client.notes,
        type: client.type,
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
          address: client.address,
          eventCount: client.events.length,
          type: client.type,
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
        capacity: `Capacidad: ${venue.capacity} personas`,
        type: venue.type,
      });

      await this.storeEmbedding({
        id: `venue-${venueId}`,
        entityId: venueId,
        type: 'venue',
        content,
        metadata: {
          name: venue.name,
          capacity: venue.capacity,
          type: venue.type,
          description: venue.description,
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
      // Iniciando re-indexación completa

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

      // Re-indexación completada: eventos, clientes y venues procesados
    } catch (error) {
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const vectorSearchService = new VectorSearchService();
