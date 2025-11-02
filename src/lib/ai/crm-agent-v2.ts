/**
 * CRM Agent V2.4 - Con Function Calling para mutaciones (CREATE/UPDATE)
 * Agente especializado en operaciones CRM con IA integrada y aprendizaje continuo
 */

import { prisma } from '@/lib/prisma';
import { crmEmbeddingService, SearchOptions } from './crm-embeddings';
import { Prisma } from '@prisma/client';
import { UnifiedAIClient } from './unified-ai-client';
import { learningSystem } from './learning-system';
import { getSchemaDescription, getQueryExamples } from './schema-introspector';
import { availableFunctions, functionMap } from './function-definitions';
import { 
  createClientSchema, 
  updateClientSchema,
  createEventSchema,
  updateEventSchema,
  createQuoteSchema,
  updateQuoteSchema,
} from '@/lib/validations/mutations';

// Interfaces para parámetros de búsqueda
export interface BaseCRMParams {
  tenantId: string;
  businessIdentityId?: string | undefined;
  limit?: number;
}

export interface SearchEventsParams extends BaseCRMParams {
  query?: string;
  clientName?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchClientsParams extends BaseCRMParams {
  query?: string;
  name?: string;
  email?: string;
  type?: string;
}

export interface SearchQuotesParams extends BaseCRMParams {
  query?: string;
  clientName?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Servicio del agente CRM simplificado
export class CRMAgentService {
  private aiClient: UnifiedAIClient;

  constructor() {
    this.aiClient = new UnifiedAIClient({
      temperature: 0.7,
      topK: 40,
      topP: 0.8,
      maxOutputTokens: 2048,
    });
  }

  /**
   * Procesa consultas CRM usando IA y búsqueda semántica con aprendizaje
   */
  async processQuery(
    query: string,
    context: {
      tenantId: string;
      businessIdentityId?: string;
      userRole: string;
    }
  ) {
    try {
      console.log('🔍 CRM Agent v2.4: Procesando consulta:', { query, context });
      
      // 1️⃣ PASO 1: Buscar ejemplos similares (RAG Learning)
      const learnedContext = await learningSystem.getLearnedContext(query, context.tenantId);
      console.log('📚 Contexto aprendido:', learnedContext.substring(0, 200) + '...');

      // 2️⃣ PASO 2: Obtener esquema de base de datos
      const schemaDescription = getSchemaDescription();
      const queryExamples = getQueryExamples();
      
      // 3️⃣ PASO 3: Detectar si es una mutación (CREATE/UPDATE) o query
      const isMutation = await this.detectMutation(query);
      
      if (isMutation) {
        console.log('🔧 Detectada operación de mutación');
        return await this.handleMutation(query, context);
      }
      
      // 4️⃣ PASO 4: Analizar intent de la consulta con contexto mejorado
      const queryIntent = await this.analyzeQueryIntent(query, {
        learnedContext,
        schemaDescription,
        queryExamples,
      });
      console.log('📋 Intent analizado:', queryIntent);

      // 5️⃣ PASO 5: Ejecutar búsqueda según el intent (DYNAMIC DISPATCH)
      let searchResults = null;
      let actionTaken = '';
      let entity = queryIntent.entity || '';

      // DYNAMIC QUERY EXECUTION basado en type y entity
      if (queryIntent.type === 'count') {
        searchResults = await this.handleCountQuery(queryIntent, context);
        actionTaken = `count_${(entity || 'unknown').toLowerCase()}s`;
      } else if (queryIntent.type === 'get') {
        searchResults = await this.handleGetQuery(queryIntent, context);
        actionTaken = `${queryIntent.action || 'get'}_${(entity || 'unknown').toLowerCase()}`;
      } else if (queryIntent.type === 'list') {
        searchResults = await this.handleListQuery(queryIntent, context);
        actionTaken = `list_${(entity || 'unknown').toLowerCase()}s`;
      } else if (queryIntent.type === 'search') {
        searchResults = await this.handleSearchQuery(queryIntent, context);
        actionTaken = `search_${(entity || 'unknown').toLowerCase()}s`;
      } else {
        // Búsqueda general como fallback
        searchResults = await this.performGeneralSearch(query, context);
        actionTaken = 'general_search';
      }

      // 6️⃣ PASO 6: Generar respuesta usando IA
      const response = await this.generateResponse(query, searchResults, context);

      // 7️⃣ PASO 7: Guardar ejemplo exitoso para aprendizaje (RAG)
      if (searchResults && (searchResults.total > 0 || searchResults.type === 'count')) {
        await learningSystem.saveSuccessfulQuery({
          userQuery: query,
          intent: queryIntent.type,
          action: actionTaken,
          entity,
          filters: queryIntent.params,
          response,
          tenantId: context.tenantId,
        });
        console.log('💾 Ejemplo guardado para aprendizaje');
      }

      return {
        query,
        intent: queryIntent,
        results: searchResults,
        response,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Error procesando consulta CRM:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
      });
      return {
        query,
        intent: { type: 'error', confidence: 0 },
        results: null,
        response: `Lo siento, hubo un error procesando tu consulta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Maneja consultas de conteo (COUNT)
   */
  private async handleCountQuery(queryIntent: any, context: any) {
    const entity = queryIntent.entity;
    
    if (entity === 'Client') {
      const count = await prisma.client.count({
        where: {
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
      });
      return {
        type: 'count',
        entity: 'clients',
        count,
        message: `Tienes ${count} cliente${count !== 1 ? 's' : ''} registrado${count !== 1 ? 's' : ''} en el sistema.`,
      };
    } else if (entity === 'Event') {
      const count = await prisma.event.count({
        where: {
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
      });
      return {
        type: 'count',
        entity: 'events',
        count,
        message: `Tienes ${count} evento${count !== 1 ? 's' : ''} registrado${count !== 1 ? 's' : ''} en el sistema.`,
      };
    } else if (entity === 'Quote') {
      const count = await prisma.quote.count({
        where: {
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
      });
      return {
        type: 'count',
        entity: 'quotes',
        count,
        message: `Tienes ${count} cotizaci${count !== 1 ? 'ones' : 'ón'} registrada${count !== 1 ? 's' : ''} en el sistema.`,
      };
    }
    
    return { type: 'error', message: 'Entidad no soportada para conteo' };
  }

  /**
   * Maneja consultas GET (primer, último, específico)
   */
  private async handleGetQuery(queryIntent: any, context: any) {
    const entity = queryIntent.entity;
    const action = queryIntent.action;
    
    if (entity === 'Client') {
      let client = null;
      
      if (action === 'getFirst') {
        client = await prisma.client.findFirst({
          where: {
            tenantId: context.tenantId,
            ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
          },
          orderBy: { createdAt: 'asc' },
        });
      } else if (action === 'getLast') {
        client = await prisma.client.findFirst({
          where: {
            tenantId: context.tenantId,
            ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
          },
          orderBy: { createdAt: 'desc' },
        });
      }
      
      if (!client) {
        return { type: 'get', entity: 'client', data: null, message: 'No se encontró ningún cliente.' };
      }
      
      return {
        type: 'get',
        entity: 'client',
        data: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          type: client.type,
        },
        message: `Cliente: ${client.name} (${client.email || 'Sin email'})`,
      };
    } else if (entity === 'Event') {
      let event = null;
      
      if (action === 'getFirst') {
        event = await prisma.event.findFirst({
          where: {
            tenantId: context.tenantId,
            ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
          },
          orderBy: { createdAt: 'asc' },
        });
      } else if (action === 'getLast') {
        event = await prisma.event.findFirst({
          where: {
            tenantId: context.tenantId,
            ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
          },
          orderBy: { createdAt: 'desc' },
        });
      }
      
      if (!event) {
        return { type: 'get', entity: 'event', data: null, message: 'No se encontró ningún evento.' };
      }
      
      return {
        type: 'get',
        entity: 'event',
        data: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          status: event.status,
        },
        message: `Evento: ${event.title} (${event.startDate.toLocaleDateString()})`,
      };
    }
    
    return { type: 'error', message: 'Entidad no soportada para GET' };
  }

  /**
   * Maneja consultas LIST (listar todos)
   */
  private async handleListQuery(queryIntent: any, context: any) {
    const entity = queryIntent.entity;
    const limit = queryIntent.params?.limit || 10;
    
    if (entity === 'Client') {
      const clients = await prisma.client.findMany({
        where: {
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      
      return {
        type: 'list',
        entity: 'clients',
        total: clients.length,
        data: clients.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          type: c.type,
        })),
      };
    } else if (entity === 'Event') {
      const events = await prisma.event.findMany({
        where: {
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
        orderBy: { startDate: 'desc' },
        take: limit,
      });
      
      return {
        type: 'list',
        entity: 'events',
        total: events.length,
        data: events.map(e => ({
          id: e.id,
          title: e.title,
          startDate: e.startDate,
          status: e.status,
        })),
      };
    } else if (entity === 'Quote') {
      const quotes = await prisma.quote.findMany({
        where: {
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      
      return {
        type: 'list',
        entity: 'quotes',
        total: quotes.length,
        data: quotes.map(q => ({
          id: q.id,
          quoteNumber: q.quoteNumber,
          status: q.status,
          total: q.total,
        })),
      };
    }
    
    return { type: 'error', message: 'Entidad no soportada para LIST' };
  }

  /**
   * Maneja consultas SEARCH (búsqueda con filtros)
   */
  private async handleSearchQuery(queryIntent: any, context: any) {
    const entity = queryIntent.entity;
    
    if (entity === 'Client') {
      return await this.searchClients({
        query: queryIntent.params?.query || '',
        tenantId: context.tenantId,
        businessIdentityId: context.businessIdentityId,
        limit: queryIntent.params?.limit || 10,
      });
    } else if (entity === 'Event') {
      return await this.searchEvents({
        query: queryIntent.params?.query || '',
        tenantId: context.tenantId,
        businessIdentityId: context.businessIdentityId,
        limit: queryIntent.params?.limit || 10,
      });
    } else if (entity === 'Quote') {
      return await this.searchQuotes({
        query: queryIntent.params?.query || '',
        tenantId: context.tenantId,
        businessIdentityId: context.businessIdentityId,
        limit: queryIntent.params?.limit || 10,
      });
    }
    
    return { type: 'error', message: 'Entidad no soportada para SEARCH' };
  }

  /**
   * Analiza el intent de la consulta usando IA con contexto aprendido
   */
  private async analyzeQueryIntent(
    query: string,
    enhancedContext?: {
      learnedContext?: string;
      schemaDescription?: string;
      queryExamples?: string;
    }
  ) {
    try {
      const prompt = `
Eres un analizador de consultas inteligente para un sistema CRM. Tienes acceso a:

${enhancedContext?.schemaDescription ? `**Esquema de base de datos:**\n${enhancedContext.schemaDescription}\n\n` : ''}

${enhancedContext?.queryExamples ? `**Ejemplos de consultas válidas:**\n${enhancedContext.queryExamples}\n\n` : ''}

${enhancedContext?.learnedContext ? `**Consultas similares exitosas del pasado:**\n${enhancedContext.learnedContext}\n\n` : ''}

**Consulta actual:** "${query}"

Analiza la consulta y clasifícala en un JSON válido con esta estructura:
{
  "type": "count|list|search|get|general",
  "entity": "Client|Event|Quote|Room|null",
  "action": "count|list|search|getFirst|getLast|getById|general",
  "params": {
    "query": "texto relevante",
    "limit": número opcional,
    "orderBy": "asc|desc|null",
    "filters": {}
  },
  "confidence": 0.8
}

**Tipos de operaciones:**

1. **COUNT** (contar): "cuántos", "total de", "número de"
   - Ejemplo: "¿cuántos clientes tenemos?" → type: "count", entity: "Client"

2. **LIST** (listar): "lista", "muestra", "dame", "dime todos"
   - Ejemplo: "lista los clientes" → type: "list", entity: "Client"
   - Ejemplo: "dame todos los eventos" → type: "list", entity: "Event"

3. **GET** (obtener específico): "primer", "último", "cliente #123"
   - Ejemplo: "dame el primer cliente" → type: "get", action: "getFirst", entity: "Client"
   - Ejemplo: "último evento" → type: "get", action: "getLast", entity: "Event"
   - Ejemplo: "nombre del primer cliente" → type: "get", action: "getFirst", entity: "Client"

4. **SEARCH** (buscar): "busca", "encuentra", "eventos de Juan"
   - Ejemplo: "busca clientes con email gmail" → type: "search", entity: "Client"

5. **GENERAL**: otras consultas

**IMPORTANTE:**
- Si menciona "primer/primera" → action: "getFirst"
- Si menciona "último/última" → action: "getLast"  
- Si menciona "nombre del primer" → type: "get", action: "getFirst"
- Si dice "lista" o "muestra todos" → type: "list"

Aprende de las consultas similares anteriores para mejorar la clasificación.

Responde SOLO con el JSON:
`;

      const result = await this.aiClient.generateContent(prompt);
      const response = result.text.trim();

      // Limpiar la respuesta para obtener solo el JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('No se pudo parsear la respuesta');
    } catch (error) {
      console.error('Error analizando intent:', error);
      return {
        type: 'general',
        params: { query },
        confidence: 0.5,
      };
    }
  }

  /**
   * Búsqueda de eventos con IA semántica
   */
  private async searchEvents(params: SearchEventsParams) {
    try {
      // Intentar búsqueda semántica si hay query
      if (params.query) {
        try {
          const searchOptions: SearchOptions = {
            type: 'event',
            limit: params.limit || 10,
            tenantId: params.tenantId,
            includeEntity: true,
          };

          if (params.businessIdentityId) {
            searchOptions.businessIdentityId = params.businessIdentityId;
          }

          const vectorResults = await crmEmbeddingService.searchSimilar(
            params.query,
            searchOptions
          );

          if (vectorResults.length > 0) {
            return {
              total: vectorResults.length,
              searchType: 'semantic',
              events: vectorResults.map(result => ({
                id: result.entity.id,
                title: (result.entity as any).title || 'Sin título',
                startDate: (result.entity as any).startDate,
                status: (result.entity as any).status,
                similarity: result.similarity,
                description: (result.entity as any).description,
              })),
            };
          }
        } catch (vectorError) {
          console.log('Búsqueda vectorial falló, usando búsqueda tradicional:', vectorError);
        }
      }

      // Búsqueda tradicional como fallback
      const whereClause: Prisma.EventWhereInput = {};

      if (params.query) {
        whereClause.OR = [
          { title: { contains: params.query, mode: 'insensitive' } },
          { notes: { contains: params.query, mode: 'insensitive' } },
        ];
      }

      const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { startDate: 'desc' },
        take: params.limit || 10,
      });

      return {
        total: events.length,
        searchType: 'traditional',
        events: events.map(event => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          status: event.status,
          description: event.notes || '',
          guestCount: 0, // Campo no disponible en el schema actual
        })),
      };
    } catch (error) {
      console.error('Error en búsqueda de eventos:', error);
      return {
        total: 0,
        searchType: 'error',
        events: [],
      };
    }
  }

  /**
   * Búsqueda de clientes con IA semántica
   */
  private async searchClients(params: SearchClientsParams) {
    try {
      // Intentar búsqueda semántica
      if (params.query) {
        try {
          const searchOptions: SearchOptions = {
            type: 'client',
            limit: params.limit || 10,
            tenantId: params.tenantId,
            includeEntity: true,
          };

          if (params.businessIdentityId) {
            searchOptions.businessIdentityId = params.businessIdentityId;
          }

          const vectorResults = await crmEmbeddingService.searchSimilar(
            params.query,
            searchOptions
          );

          if (vectorResults.length > 0) {
            return {
              total: vectorResults.length,
              searchType: 'semantic',
              clients: vectorResults.map(result => ({
                id: result.entity.id,
                name: (result.entity as any).name,
                email: (result.entity as any).email,
                phone: (result.entity as any).phone,
                similarity: result.similarity,
              })),
            };
          }
        } catch (vectorError) {
          console.log('Búsqueda vectorial falló, usando búsqueda tradicional:', vectorError);
        }
      }

      // Búsqueda tradicional
      const whereClause: Prisma.ClientWhereInput = {};

      if (params.query) {
        whereClause.OR = [
          { name: { contains: params.query, mode: 'insensitive' } },
          { email: { contains: params.query, mode: 'insensitive' } },
          { notes: { contains: params.query, mode: 'insensitive' } },
        ];
      }

      const clients = await prisma.client.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 10,
      });

      return {
        total: clients.length,
        searchType: 'traditional',
        clients: clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: '', // Campo no disponible en el schema actual
          type: client.type,
        })),
      };
    } catch (error) {
      console.error('Error en búsqueda de clientes:', error);
      return {
        total: 0,
        searchType: 'error',
        clients: [],
      };
    }
  }

  /**
   * Búsqueda de cotizaciones con IA semántica
   */
  private async searchQuotes(params: SearchQuotesParams) {
    try {
      // Intentar búsqueda semántica
      if (params.query) {
        try {
          const searchOptions: SearchOptions = {
            type: 'quote',
            limit: params.limit || 10,
            tenantId: params.tenantId,
            includeEntity: true,
          };

          if (params.businessIdentityId) {
            searchOptions.businessIdentityId = params.businessIdentityId;
          }

          const vectorResults = await crmEmbeddingService.searchSimilar(
            params.query,
            searchOptions
          );

          if (vectorResults.length > 0) {
            return {
              total: vectorResults.length,
              searchType: 'semantic',
              quotes: vectorResults.map(result => ({
                id: result.entity.id,
                number: (result.entity as any).number || (result.entity as any).quoteNumber,
                status: (result.entity as any).status,
                total: Number((result.entity as any).total || 0),
                similarity: result.similarity,
              })),
            };
          }
        } catch (vectorError) {
          console.log('Búsqueda vectorial falló, usando búsqueda tradicional:', vectorError);
        }
      }

      // Búsqueda tradicional
      const whereClause: Prisma.QuoteWhereInput = {};

      if (params.query) {
        whereClause.OR = [
          { quoteNumber: { contains: params.query, mode: 'insensitive' } },
          { notes: { contains: params.query, mode: 'insensitive' } },
        ];
      }

      const quotes = await prisma.quote.findMany({
        where: whereClause,
        include: {
          client: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 10,
      });

      return {
        total: quotes.length,
        searchType: 'traditional',
        quotes: quotes.map((quote: any) => ({
          id: quote.id,
          number: quote.number,
          status: quote.status,
          total: Number(quote.total),
          subtotal: Number(quote.subtotal),
          client: quote.client
            ? {
                name: quote.client.name,
                email: quote.client.email,
              }
            : null,
          validUntil: quote.validUntil,
          createdAt: quote.createdAt,
        })),
      };
    } catch (error) {
      console.error('Error en búsqueda de cotizaciones:', error);
      return {
        total: 0,
        searchType: 'error',
        quotes: [],
      };
    }
  }

  /**
   * Búsqueda general usando múltiples fuentes
   */
  private async performGeneralSearch(query: string, context: any) {
    try {
      // Intentar búsqueda semántica general
      const results = await crmEmbeddingService.searchSimilar(query, {
        limit: 15,
        tenantId: context.tenantId,
        businessIdentityId: context.businessIdentityId,
        includeEntity: true,
      });

      // Separar resultados por tipo
      const groupedResults: any = {
        events: [],
        clients: [],
        quotes: [],
        products: [],
      };

      results.forEach(result => {
        const resultData = {
          id: result.entity.id,
          similarity: result.similarity,
        };

        // Intentar determinar el tipo de entidad por las propiedades
        if ((result.entity as any).title && (result.entity as any).startDate) {
          groupedResults.events.push({
            ...resultData,
            title: (result.entity as any).title,
            startDate: (result.entity as any).startDate,
            status: (result.entity as any).status,
          });
        } else if ((result.entity as any).name && (result.entity as any).email) {
          groupedResults.clients.push({
            ...resultData,
            name: (result.entity as any).name,
            email: (result.entity as any).email,
          });
        } else if ((result.entity as any).number || (result.entity as any).quoteNumber) {
          groupedResults.quotes.push({
            ...resultData,
            number: (result.entity as any).number || (result.entity as any).quoteNumber,
            status: (result.entity as any).status,
          });
        }
      });

      return {
        total: results.length,
        searchType: 'semantic-general',
        ...groupedResults,
      };
    } catch (error) {
      console.error('Error en búsqueda general:', error);
      return {
        total: 0,
        searchType: 'error',
        events: [],
        clients: [],
        quotes: [],
        products: [],
      };
    }
  }

  /**
   * Genera respuesta usando IA basada en los resultados
   */
  private async generateResponse(query: string, results: any, _context: any) {
    // Si es una consulta de conteo, devolver el mensaje directo
    if (results?.type === 'count') {
      return results.message;
    }

    // Si es una consulta GET con data específica
    if (results?.type === 'get' && results.data) {
      if (results.entity === 'client') {
        return `El cliente es: **${results.data.name}**${results.data.email ? ` (${results.data.email})` : ''}${results.data.phone ? `, teléfono: ${results.data.phone}` : ''}.`;
      } else if (results.entity === 'event') {
        return `El evento es: **${results.data.title}** programado para ${new Date(results.data.startDate).toLocaleDateString()}, estado: ${results.data.status}.`;
      }
      return results.message;
    }

    // Si es una consulta GET sin resultados
    if (results?.type === 'get' && !results.data) {
      return results.message || 'No se encontró ningún resultado.';
    }

    // Si es una consulta LIST
    if (results?.type === 'list' && results.data && results.data.length > 0) {
      if (results.entity === 'clients') {
        const clientList = results.data.map((c: any, idx: number) => 
          `${idx + 1}. **${c.name}**${c.email ? ` (${c.email})` : ''}${c.phone ? `, tel: ${c.phone}` : ''}`
        ).join('\n');
        return `📋 **Lista de clientes** (${results.total}):\n\n${clientList}`;
      } else if (results.entity === 'events') {
        const eventList = results.data.map((e: any, idx: number) => 
          `${idx + 1}. **${e.title}** - ${new Date(e.startDate).toLocaleDateString()} (${e.status})`
        ).join('\n');
        return `📅 **Lista de eventos** (${results.total}):\n\n${eventList}`;
      } else if (results.entity === 'quotes') {
        const quoteList = results.data.map((q: any, idx: number) => 
          `${idx + 1}. **${q.quoteNumber}** - Estado: ${q.status}, Total: $${q.total}`
        ).join('\n');
        return `💰 **Lista de cotizaciones** (${results.total}):\n\n${quoteList}`;
      }
    }

    if (!results || results.total === 0) {
      return this.generateEmptyResponse(query);
    }

    try {
      const prompt = `
Eres un asistente de Plexo. Responde de manera natural basándote en estos resultados:

Consulta: "${query}"
Resultados: ${JSON.stringify(results, null, 2)}

Instrucciones:
1. Responde en español, tono profesional pero amigable
2. Resume los resultados más relevantes
3. Si hay fechas, formatéalas legiblemente
4. Si hay montos, muéstralos claramente
5. Organiza la información de manera clara
6. Máximo 150 palabras

Respuesta:
`;

      const result = await this.aiClient.generateContent(prompt);
      return result.text;
    } catch (error) {
      console.error('Error generando respuesta:', error);
      return this.generateFallbackResponse(results);
    }
  }

  /**
   * Respuesta cuando no hay resultados
   */
  private generateEmptyResponse(query: string) {
    return `No encontré resultados para "${query}". Intenta con términos más específicos como nombres de clientes, números de cotización, o tipos de eventos.`;
  }

  /**
   * Respuesta de fallback si falla la IA
   */
  private generateFallbackResponse(results: any) {
    let response = `Encontré ${results.total} resultado(s):\n\n`;

    if (results.events && results.events.length > 0) {
      response += `**Eventos (${results.events.length}):**\n`;
      results.events.slice(0, 3).forEach((event: any) => {
        response += `- ${event.title} (${new Date(event.startDate).toLocaleDateString()})\n`;
      });
      response += '\n';
    }

    if (results.clients && results.clients.length > 0) {
      response += `**Clientes (${results.clients.length}):**\n`;
      results.clients.slice(0, 3).forEach((client: any) => {
        response += `- ${client.name} (${client.email || 'Sin email'})\n`;
      });
      response += '\n';
    }

    if (results.quotes && results.quotes.length > 0) {
      response += `**Cotizaciones (${results.quotes.length}):**\n`;
      results.quotes.slice(0, 3).forEach((quote: any) => {
        response += `- ${quote.number} - ${quote.status}\n`;
      });
    }

    return response;
  }

  // ============================================
  // MUTATION METHODS (Function Calling)
  // ============================================

  /**
   * Detecta si la consulta es una mutación (CREATE/UPDATE) o solo lectura
   */
  private async detectMutation(query: string): Promise<boolean> {
    const lowerQuery = query.toLowerCase();
    const mutationKeywords = [
      'crear', 'crear', 'nuevo', 'nueva', 'agregar', 'agrega',
      'actualizar', 'actualiza', 'modificar', 'modifica', 'cambiar', 'cambia',
      'registrar', 'registra', 'dar de alta', 'alta de',
      'editar', 'edita', 'update', 'create'
    ];
    
    return mutationKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Maneja operaciones de mutación usando Function Calling
   */
  private async handleMutation(query: string, context: any) {
    try {
      console.log('🔧 Procesando mutación con Function Calling');

      // 1. Determinar función y extraer parámetros usando IA
      const functionCall = await this.analyzeFunctionCall(query);
      console.log('📞 Function call:', functionCall);

      if (!functionCall || !functionCall.name) {
        return {
          query,
          intent: { type: 'mutation', confidence: 0.5 },
          results: null,
          response: 'No pude determinar qué operación deseas realizar. Por favor, sé más específico.',
          timestamp: new Date(),
        };
      }

      // 2. Ejecutar la función
      const result = await this.executeFunctionCall(functionCall.name, functionCall.arguments, context);
      
      // 3. Guardar en RAG
      await learningSystem.saveSuccessfulQuery({
        userQuery: query,
        intent: 'mutation',
        action: functionCall.name,
        entity: this.extractEntityFromFunction(functionCall.name),
        filters: functionCall.arguments,
        response: result.message,
        tenantId: context.tenantId,
      });

      return {
        query,
        intent: { type: 'mutation', action: functionCall.name, confidence: 1.0 },
        results: result.data,
        response: result.message,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Error en mutación:', error);
      return {
        query,
        intent: { type: 'mutation', confidence: 0 },
        results: null,
        response: `Error ejecutando la operación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Analiza la consulta para determinar qué función llamar y con qué parámetros
   */
  private async analyzeFunctionCall(query: string): Promise<{ name: string; arguments: any } | null> {
    try {
      const prompt = `
Eres un asistente que determina qué función llamar basándote en la consulta del usuario.

Funciones disponibles:
${JSON.stringify(availableFunctions, null, 2)}

Consulta del usuario: "${query}"

INSTRUCCIONES:
1. Determina qué función es la más apropiada
2. Extrae los parámetros de la consulta
3. Responde SOLO con JSON válido en este formato:
{
  "name": "nombre_de_funcion",
  "arguments": {
    "param1": "valor1",
    "param2": "valor2"
  }
}

Si la consulta menciona fechas, conviértelas a formato ISO (YYYY-MM-DDTHH:MM:SSZ).
Si falta información crítica, usa null para ese parámetro.

Respuesta JSON:
`;

      const result = await this.aiClient.generateContent(prompt);
      const cleanedText = result.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error analizando function call:', error);
      return null;
    }
  }

  /**
   * Ejecuta la función determinada por el análisis de IA
   */
  private async executeFunctionCall(functionName: string, args: any, context: any) {
    console.log(`🚀 Ejecutando ${functionName} con args:`, args);

    switch (functionName) {
      case 'createClient':
        return await this.createClient(args, context);
      case 'updateClient':
        return await this.updateClient(args, context);
      case 'createEvent':
        return await this.createEvent(args, context);
      case 'updateEvent':
        return await this.updateEvent(args, context);
      case 'createQuote':
        return await this.createQuote(args, context);
      case 'updateQuote':
        return await this.updateQuote(args, context);
      default:
        throw new Error(`Función no soportada: ${functionName}`);
    }
  }

  /**
   * Extrae el nombre de la entidad del nombre de función
   */
  private extractEntityFromFunction(functionName: string): string {
    if (functionName.includes('Client')) return 'Client';
    if (functionName.includes('Event')) return 'Event';
    if (functionName.includes('Quote')) return 'Quote';
    return 'Unknown';
  }

  // ============================================
  // CLIENT MUTATIONS
  // ============================================

  /**
   * Crea un nuevo cliente
   */
  private async createClient(args: any, context: any) {
    try {
      // Validar con Zod
      const validatedData = createClientSchema.parse(args);

      // Verificar email único
      const existingClient = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          tenantId: context.tenantId,
          deletedAt: null,
        },
      });

      if (existingClient) {
        throw new Error(`Ya existe un cliente con el email ${validatedData.email}`);
      }

      // Crear cliente
      const client = await prisma.client.create({
        data: {
          ...validatedData,
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
      });

      console.log('✅ Cliente creado:', client.id);

      return {
        success: true,
        data: client,
        message: `✅ Cliente **${client.name}** creado exitosamente. Email: ${client.email}`,
      };
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  }

  /**
   * Actualiza un cliente existente
   */
  private async updateClient(args: any, context: any) {
    try {
      const { clientId, ...updateData } = args;

      if (!clientId) {
        throw new Error('Se requiere clientId para actualizar');
      }

      // Validar con Zod
      const validatedData = updateClientSchema.parse(updateData);

      // Verificar que el cliente existe y pertenece al tenant
      const existingClient = await prisma.client.findFirst({
        where: {
          id: clientId,
          tenantId: context.tenantId,
          deletedAt: null,
        },
      });

      if (!existingClient) {
        throw new Error('Cliente no encontrado o no tienes permisos para modificarlo');
      }

      // Actualizar cliente
      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: validatedData as any,
      });

      console.log('✅ Cliente actualizado:', updatedClient.id);

      return {
        success: true,
        data: updatedClient,
        message: `✅ Cliente **${updatedClient.name}** actualizado exitosamente.`,
      };
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      throw error;
    }
  }

  // ============================================
  // EVENT MUTATIONS
  // ============================================

  /**
   * Crea un nuevo evento
   */
  private async createEvent(args: any, context: any) {
    try {
      // Validar con Zod
      const validatedData = createEventSchema.parse(args);

      // Verificar que el cliente existe y pertenece al tenant
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          tenantId: context.tenantId,
          deletedAt: null,
        },
      });

      if (!client) {
        throw new Error('Cliente no encontrado o no pertenece a tu organización');
      }

      // Crear evento
      const event = await prisma.event.create({
        data: {
          ...validatedData,
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
        include: {
          client: {
            select: { name: true },
          },
        },
      });

      console.log('✅ Evento creado:', event.id);

      return {
        success: true,
        data: event,
        message: `✅ Evento **${event.title}** creado exitosamente para el cliente ${event.client.name}. Fecha: ${new Date(event.startDate).toLocaleDateString()}`,
      };
    } catch (error) {
      console.error('Error creando evento:', error);
      throw error;
    }
  }

  /**
   * Actualiza un evento existente
   */
  private async updateEvent(args: any, context: any) {
    try {
      const { eventId, ...updateData } = args;

      if (!eventId) {
        throw new Error('Se requiere eventId para actualizar');
      }

      // Validar con Zod
      const validatedData = updateEventSchema.parse(updateData);

      // Verificar que el evento existe y pertenece al tenant
      const existingEvent = await prisma.event.findFirst({
        where: {
          id: eventId,
          tenantId: context.tenantId,
        },
      });

      if (!existingEvent) {
        throw new Error('Evento no encontrado o no tienes permisos para modificarlo');
      }

      // Actualizar evento
      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: validatedData as any,
      });

      console.log('✅ Evento actualizado:', updatedEvent.id);

      return {
        success: true,
        data: updatedEvent,
        message: `✅ Evento **${updatedEvent.title}** actualizado exitosamente.`,
      };
    } catch (error) {
      console.error('Error actualizando evento:', error);
      throw error;
    }
  }

  // ============================================
  // QUOTE MUTATIONS
  // ============================================

  /**
   * Crea una nueva cotización
   */
  private async createQuote(args: any, context: any) {
    try {
      // Validar con Zod
      const validatedData = createQuoteSchema.parse(args);

      // Verificar que el cliente existe
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          tenantId: context.tenantId,
          deletedAt: null,
        },
      });

      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      // Generar número de cotización
      const lastQuote = await prisma.quote.findFirst({
        where: { tenantId: context.tenantId },
        orderBy: { createdAt: 'desc' },
      });

      const year = new Date().getFullYear();
      const lastNumber = lastQuote?.quoteNumber?.match(/QUO-\d{4}-(\d+)/)?.[1];
      const nextNumber = lastNumber ? parseInt(lastNumber) + 1 : 1;
      const quoteNumber = `QUO-${year}-${String(nextNumber).padStart(3, '0')}`;

      // Crear cotización
      const quote = await prisma.quote.create({
        data: {
          ...validatedData,
          quoteNumber: quoteNumber,
          tenantId: context.tenantId,
          ...(context.businessIdentityId && { businessIdentityId: context.businessIdentityId }),
        },
        include: {
          client: {
            select: { name: true },
          },
        },
      });

      console.log('✅ Cotización creada:', quote.id);

      return {
        success: true,
        data: quote,
        message: `✅ Cotización **${quote.quoteNumber}** creada exitosamente para ${quote.client.name}. Total: $${quote.total}`,
      };
    } catch (error) {
      console.error('Error creando cotización:', error);
      throw error;
    }
  }

  /**
   * Actualiza una cotización existente
   */
  private async updateQuote(args: any, context: any) {
    try {
      const { quoteId, ...updateData } = args;

      if (!quoteId) {
        throw new Error('Se requiere quoteId para actualizar');
      }

      // Validar con Zod
      const validatedData = updateQuoteSchema.parse(updateData);

      // Verificar que la cotización existe
      const existingQuote = await prisma.quote.findFirst({
        where: {
          id: quoteId,
          tenantId: context.tenantId,
        },
      });

      if (!existingQuote) {
        throw new Error('Cotización no encontrada');
      }

      // Actualizar cotización
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: validatedData as any,
      });

      console.log('✅ Cotización actualizada:', updatedQuote.id);

      return {
        success: true,
        data: updatedQuote,
        message: `✅ Cotización **${updatedQuote.quoteNumber}** actualizada exitosamente.`,
      };
    } catch (error) {
      console.error('Error actualizando cotización:', error);
      throw error;
    }
  }

  // ============================================
  // EXISTING QUERY METHODS
  // ============================================

}

// Instancia singleton del servicio
export const crmAgentService = new CRMAgentService();
