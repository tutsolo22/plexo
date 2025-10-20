// Archivo temporal para build - modelos embedding no implementados en Prisma

export interface SearchOptions {
  id: string;
  entityId: string;
  type: string;
  content: string;
  metadata?: any;
}

export interface SearchResult {
  id: string;
  entityId: string;
  entityType: string;
  content: string;
  score: number;
  metadata: any;
}

export interface VectorSearchOptions {
  query: string;
  type?: string;
  limit?: number;
  threshold?: number;
  businessIdentityId?: string;
}

export class VectorSearchService {
  private static instance: VectorSearchService;

  static getInstance(): VectorSearchService {
    if (!VectorSearchService.instance) {
      VectorSearchService.instance = new VectorSearchService();
    }
    return VectorSearchService.instance;
  }

  async indexContent(options: SearchOptions): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
    console.log('Indexing content (stub):', options.id);
  }

  async indexEvent(_eventId: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async indexClient(_clientId: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async indexVenue(_venueId: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async search(_options: VectorSearchOptions): Promise<SearchResult[]> {
    // TODO: Implementar con modelos Prisma reales
    console.log('Vector search (stub):', _options.query);
    return [];
  }

  async searchSimilar(_query: string, _options?: any): Promise<SearchResult[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }

  async searchEvents(
    _query: string,
    _businessIdentityId?: string,
    _limit: number = 5
  ): Promise<SearchResult[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }

  async searchClients(
    _query: string,
    _businessIdentityId?: string,
    _limit: number = 5
  ): Promise<SearchResult[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }

  async searchVenues(
    _query: string,
    _businessIdentityId?: string,
    _limit: number = 5
  ): Promise<SearchResult[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }

  async deleteByEntityId(_entityId: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async deleteByType(_entityType: string, _businessIdentityId?: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async reindexAll(_businessIdentityId?: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async getStats(_businessIdentityId?: string): Promise<any> {
    // TODO: Implementar con modelos Prisma reales
    return {
      totalEmbeddings: 0,
      byType: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  async healthCheck(): Promise<boolean> {
    // TODO: Implementar con modelos Prisma reales
    return true;
  }
}

export const vectorSearchService = VectorSearchService.getInstance();
