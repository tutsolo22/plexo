import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Configuración de Gemini AI para embeddings
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
}

export interface CRMSearchResult {
  id: string;
  similarity: number;
  content: string;
  metadata: Record<string, any>;
  type: 'event' | 'client' | 'quote' | 'product' | 'service' | 'room';
  entity: any; // Datos completos de la entidad
}

export interface SearchOptions {
  type?: string;
  limit?: number;
  threshold?: number;
  tenantId?: string;
  businessIdentityId?: string;
  includeEntity?: boolean;
}

export class CRMEmbeddingService {
  private model: any;
  private dimensions: number = 768; // Dimensiones estándar de Gemini embeddings

  constructor() {
    // Usar el modelo de embeddings de Gemini
    this.model = genAI.getGenerativeModel({ model: 'embedding-001' });
  }

  /**
   * Genera embedding usando Gemini AI
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const result = await this.model.embedContent(text);
      const embedding = result.embedding.values;

      return {
        embedding,
        dimensions: embedding.length
      };
    } catch (error) {
      console.error('Error generando embedding con Gemini:', error);
      throw new Error('Failed to generate embedding with Gemini');
    }
  }

  /**
   * Genera embeddings para múltiples textos
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    // Procesar en lotes para evitar límites de rate
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pausa breve entre lotes
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Indexa un evento en la base de vectores
   */
  async indexEvent(eventId: string, tenantId: string): Promise<void> {
    try {
      const event = await prisma.event.findFirst({
        where: { id: eventId, tenantId },
        include: {
          client: {
            select: { name: true, email: true, type: true }
          },
          room: {
            include: {
              location: {
                include: {
                  businessIdentity: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          user: {
            select: { name: true }
          }
        }
      });

      if (!event) return;

      // Crear texto descriptivo para embedding
      const content = this.createEventContent(event);
      const { embedding } = await this.generateEmbedding(content);

      // Guardar en la tabla de vectores
      await prisma.aiEmbedding.upsert({
        where: {
          entityId_entityType: {
            entityId: eventId,
            entityType: 'EVENT'
          }
        },
        update: {
          embedding: embedding,
          content,
          metadata: {
            status: event.status,
            clientType: event.client?.type,
            businessIdentity: event.room?.location?.businessIdentity?.name,
            location: event.room?.location?.name,
            room: event.room?.name
          },
          updatedAt: new Date()
        },
        create: {
          entityId: eventId,
          entityType: 'EVENT',
          tenantId,
          embedding: embedding,
          content,
          metadata: {
            status: event.status,
            clientType: event.client?.type,
            businessIdentity: event.room?.location?.businessIdentity?.name,
            location: event.room?.location?.name,
            room: event.room?.name
          }
        }
      });

    } catch (error) {
      console.error('Error indexando evento:', error);
    }
  }

  /**
   * Indexa un cliente en la base de vectores
   */
  async indexClient(clientId: string, tenantId: string): Promise<void> {
    try {
      const client = await prisma.client.findFirst({
        where: { id: clientId, tenantId },
        include: {
          priceList: {
            select: { name: true, type: true }
          },
          user: {
            select: { name: true }
          },
          _count: {
            select: {
              events: true,
              quotes: true
            }
          }
        }
      });

      if (!client) return;

      const content = this.createClientContent(client);
      const { embedding } = await this.generateEmbedding(content);

      await prisma.aiEmbedding.upsert({
        where: {
          entityId_entityType: {
            entityId: clientId,
            entityType: 'CLIENT'
          }
        },
        update: {
          embedding: embedding,
          content,
          metadata: {
            type: client.type,
            priceListType: client.priceList?.type,
            eventsCount: client._count.events,
            quotesCount: client._count.quotes
          },
          updatedAt: new Date()
        },
        create: {
          entityId: clientId,
          entityType: 'CLIENT',
          tenantId,
          embedding: embedding,
          content,
          metadata: {
            type: client.type,
            priceListType: client.priceList?.type,
            eventsCount: client._count.events,
            quotesCount: client._count.quotes
          }
        }
      });

    } catch (error) {
      console.error('Error indexando cliente:', error);
    }
  }

  /**
   * Indexa una cotización en la base de vectores
   */
  async indexQuote(quoteId: string, tenantId: string): Promise<void> {
    try {
      const quote = await prisma.quote.findFirst({
        where: { id: quoteId, tenantId },
        include: {
          client: {
            select: { name: true, email: true, type: true }
          },
          businessIdentity: {
            select: { name: true }
          },
          event: {
            include: {
              room: {
                include: {
                  location: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          packages: {
            include: {
              packageTemplate: {
                select: { name: true, description: true }
              }
            }
          }
        }
      });

      if (!quote) return;

      const content = this.createQuoteContent(quote);
      const { embedding } = await this.generateEmbedding(content);

      await prisma.aiEmbedding.upsert({
        where: {
          entityId_entityType: {
            entityId: quoteId,
            entityType: 'QUOTE'
          }
        },
        update: {
          embedding: embedding,
          content,
          metadata: {
            status: quote.status,
            total: Number(quote.total),
            clientType: quote.client.type,
            businessIdentity: quote.businessIdentity.name,
            hasEvent: !!quote.event,
            packagesCount: quote.packages.length
          },
          updatedAt: new Date()
        },
        create: {
          entityId: quoteId,
          entityType: 'QUOTE',
          tenantId,
          embedding: embedding,
          content,
          metadata: {
            status: quote.status,
            total: Number(quote.total),
            clientType: quote.client.type,
            businessIdentity: quote.businessIdentity.name,
            hasEvent: !!quote.event,
            packagesCount: quote.packages.length
          }
        }
      });

    } catch (error) {
      console.error('Error indexando cotización:', error);
    }
  }

  /**
   * Indexa un producto en la base de vectores  
   */
  async indexProduct(productId: string, tenantId: string): Promise<void> {
    try {
      const product = await prisma.product.findFirst({
        where: { id: productId, tenantId },
        include: {
          productPrices: {
            include: {
              priceList: {
                select: { name: true, type: true }
              }
            }
          }
        }
      });

      if (!product) return;

      const content = this.createProductContent(product);
      const { embedding } = await this.generateEmbedding(content);

      await prisma.aiEmbedding.upsert({
        where: {
          entityId_entityType: {
            entityId: productId,
            entityType: 'PRODUCT'
          }
        },
        update: {
          embedding: embedding,
          content,
          metadata: {
            type: product.type,
            category: product.category,
            unit: product.unit,
            isActive: product.isActive,
            pricesCount: product.productPrices.length
          },
          updatedAt: new Date()
        },
        create: {
          entityId: productId,
          entityType: 'PRODUCT', 
          tenantId,
          embedding: embedding,
          content,
          metadata: {
            type: product.type,
            category: product.category,
            unit: product.unit,
            isActive: product.isActive,
            pricesCount: product.productPrices.length
          }
        }
      });

    } catch (error) {
      console.error('Error indexando producto:', error);
    }
  }

  /**
   * Busca entidades similares usando vector search
   */
  async searchSimilar(
    query: string, 
    options: SearchOptions = {}
  ): Promise<CRMSearchResult[]> {
    try {
      const { embedding } = await this.generateEmbedding(query);
      const limit = options.limit || 10;
      const threshold = options.threshold || 0.7;

      // Construir filtros WHERE
      const whereConditions: string[] = [];
      const parameters: any[] = [];
      let paramIndex = 1;

      if (options.tenantId) {
        whereConditions.push(`tenant_id = $${paramIndex}`);
        parameters.push(options.tenantId);
        paramIndex++;
      }

      if (options.type) {
        whereConditions.push(`entity_type = $${paramIndex}`);
        parameters.push(options.type.toUpperCase());
        paramIndex++;
      }

      if (options.businessIdentityId) {
        whereConditions.push(`metadata->>'businessIdentity' = $${paramIndex}`);
        parameters.push(options.businessIdentityId);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')} AND` 
        : 'WHERE';

      // Query SQL con pgvector
      const query_sql = `
        SELECT 
          entity_id,
          entity_type,
          content,
          metadata,
          1 - (embedding <=> $${paramIndex}::vector) as similarity
        FROM ai_embeddings 
        ${whereClause} 1 - (embedding <=> $${paramIndex}::vector) > $${paramIndex + 1}
        ORDER BY embedding <=> $${paramIndex}::vector
        LIMIT $${paramIndex + 2}
      `;

      parameters.push(`[${embedding.join(',')}]`, threshold, limit);

      const results = await prisma.$queryRawUnsafe(
        query_sql,
        ...parameters
      ) as any[];

      // Enriquecer resultados con datos de entidades si se solicita
      const enrichedResults: CRMSearchResult[] = [];
      
      for (const result of results) {
        const searchResult: CRMSearchResult = {
          id: result.entity_id,
          similarity: result.similarity,
          content: result.content,
          metadata: result.metadata,
          type: result.entity_type.toLowerCase(),
          entity: null
        };

        if (options.includeEntity) {
          searchResult.entity = await this.getEntityData(
            result.entity_id, 
            result.entity_type,
            options.tenantId!
          );
        }

        enrichedResults.push(searchResult);
      }

      return enrichedResults;

    } catch (error) {
      console.error('Error en búsqueda vectorial:', error);
      return [];
    }
  }

  /**
   * Re-indexa todas las entidades de un tenant
   */
  async reindexTenant(tenantId: string): Promise<void> {
    console.log(`Iniciando re-indexación del tenant: ${tenantId}`);

    try {
      // Re-indexar eventos
      const events = await prisma.event.findMany({
        where: { tenantId },
        select: { id: true }
      });

      for (const event of events) {
        await this.indexEvent(event.id, tenantId);
      }

      // Re-indexar clientes
      const clients = await prisma.client.findMany({
        where: { tenantId },
        select: { id: true }
      });

      for (const client of clients) {
        await this.indexClient(client.id, tenantId);
      }

      // Re-indexar cotizaciones
      const quotes = await prisma.quote.findMany({
        where: { tenantId },
        select: { id: true }
      });

      for (const quote of quotes) {
        await this.indexQuote(quote.id, tenantId);
      }

      // Re-indexar productos 
      const products = await prisma.product.findMany({
        where: { tenantId },
        select: { id: true }
      });

      for (const product of products) {
        await this.indexProduct(product.id, tenantId);
      }

      console.log(`Re-indexación completada para tenant: ${tenantId}`);
      console.log(`- Eventos: ${events.length}`);
      console.log(`- Clientes: ${clients.length}`);
      console.log(`- Cotizaciones: ${quotes.length}`);
      console.log(`- Productos: ${products.length}`);

    } catch (error) {
      console.error('Error en re-indexación:', error);
      throw error;
    }
  }

  // Métodos privados para crear contenido descriptivo

  private createEventContent(event: any): string {
    return `
Evento: ${event.title}
Estado: ${event.status}
Fecha: ${event.startDate.toISOString().split('T')[0]}
Cliente: ${event.client?.name || 'Sin cliente'}
Tipo de cliente: ${event.client?.type || 'N/A'}
Sala: ${event.room?.name || 'Sin sala'}
Ubicación: ${event.room?.location?.name || 'Sin ubicación'}
Identidad de negocio: ${event.room?.location?.businessIdentity?.name || 'Sin identidad'}
Notas: ${event.notes || 'Sin notas'}
Creado por: ${event.user?.name || 'Usuario desconocido'}
    `.trim();
  }

  private createClientContent(client: any): string {
    return `
Cliente: ${client.name}
Email: ${client.email || 'Sin email'}
Teléfono: ${client.phone || 'Sin teléfono'}
Tipo: ${client.type}
Lista de precios: ${client.priceList?.name || 'Sin lista'}
Dirección: ${client.address || 'Sin dirección'}
Notas: ${client.notes || 'Sin notas'}
Total eventos: ${client._count?.events || 0}
Total cotizaciones: ${client._count?.quotes || 0}
    `.trim();
  }

  private createQuoteContent(quote: any): string {
    const packages = quote.packages?.map((p: any) => p.packageTemplate?.name).join(', ') || 'Sin paquetes';
    
    return `
Cotización: ${quote.quoteNumber}
Estado: ${quote.status}
Cliente: ${quote.client.name}
Tipo de cliente: ${quote.client.type}
Total: $${quote.total}
Identidad de negocio: ${quote.businessIdentity.name}
Evento asociado: ${quote.event?.title || 'Sin evento asociado'}
Sala del evento: ${quote.event?.room?.name || 'Sin sala'}
Ubicación: ${quote.event?.room?.location?.name || 'Sin ubicación'}
Paquetes incluidos: ${packages}
Válida hasta: ${quote.validUntil?.toISOString().split('T')[0] || 'Sin fecha'}
Notas: ${quote.notes || 'Sin notas'}
Términos: ${quote.terms || 'Sin términos'}
    `.trim();
  }

  private createProductContent(product: any): string {
    const prices = product.productPrices?.map((p: any) => 
      `${p.priceList?.name}: $${p.price}`
    ).join(', ') || 'Sin precios';

    return `
Producto: ${product.name}
Tipo: ${product.type}
Categoría: ${product.category || 'Sin categoría'}
Descripción: ${product.description || 'Sin descripción'}
Unidad: ${product.unit}
Estado: ${product.isActive ? 'Activo' : 'Inactivo'}
SKU: ${product.sku || 'Sin SKU'}
Precios: ${prices}
    `.trim();
  }

  private async getEntityData(entityId: string, entityType: string, tenantId: string): Promise<any> {
    switch (entityType) {
      case 'EVENT':
        return prisma.event.findFirst({
          where: { id: entityId, tenantId },
          include: {
            client: { select: { name: true, email: true, type: true } },
            room: {
              include: {
                location: {
                  include: {
                    businessIdentity: { select: { name: true } }
                  }
                }
              }
            }
          }
        });

      case 'CLIENT':
        return prisma.client.findFirst({
          where: { id: entityId, tenantId },
          include: {
            priceList: { select: { name: true, type: true } },
            _count: { select: { events: true, quotes: true } }
          }
        });

      case 'QUOTE':
        return prisma.quote.findFirst({
          where: { id: entityId, tenantId },
          include: {
            client: { select: { name: true, email: true } },
            businessIdentity: { select: { name: true } },
            event: {
              include: {
                room: { include: { location: { select: { name: true } } } }
              }
            }
          }
        });

      case 'PRODUCT':
        return prisma.product.findFirst({
          where: { id: entityId, tenantId },
          include: {
            productPrices: {
              include: { priceList: { select: { name: true, type: true } } }
            }
          }
        });

      default:
        return null;
    }
  }
}

// Instancia singleton del servicio
export const crmEmbeddingService = new CRMEmbeddingService();