/**
 * CRM Agent V2.1 - Versión simplificada y funcional
 * Agente especializado en operaciones CRM con IA integrada
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { crmEmbeddingService } from './crm-embeddings';

// Configuración del modelo Gemini
const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']!);

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
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });
  }

  /**
   * Procesa consultas CRM usando IA y búsqueda semántica
   */
  async processQuery(query: string, context: {
    tenantId: string;
    businessIdentityId?: string;
    userRole: string;
  }) {
    try {
      // Analizar intent de la consulta
      const queryIntent = await this.analyzeQueryIntent(query);
      
      // Ejecutar búsqueda según el intent
      let searchResults = null;
      
      if (queryIntent.type === 'searchEvents' || query.toLowerCase().includes('evento')) {
        const eventParams: SearchEventsParams = {
          query: queryIntent.params.query || query,
          tenantId: context.tenantId,
          limit: 10
        };
        if (context.businessIdentityId) {
          eventParams.businessIdentityId = context.businessIdentityId;
        }
        searchResults = await this.searchEvents(eventParams);
      } else if (queryIntent.type === 'searchClients' || query.toLowerCase().includes('cliente')) {
        const clientParams: SearchClientsParams = {
          query: queryIntent.params.query || query,
          tenantId: context.tenantId,
          limit: 10
        };
        if (context.businessIdentityId) {
          clientParams.businessIdentityId = context.businessIdentityId;
        }
        searchResults = await this.searchClients(clientParams);
      } else if (queryIntent.type === 'searchQuotes' || query.toLowerCase().includes('cotizac')) {
        const quoteParams: SearchQuotesParams = {
          query: queryIntent.params.query || query,
          tenantId: context.tenantId,
          limit: 10
        };
        if (context.businessIdentityId) {
          quoteParams.businessIdentityId = context.businessIdentityId;
        }
        searchResults = await this.searchQuotes(quoteParams);
      } else {
        // Búsqueda general
        searchResults = await this.performGeneralSearch(query, context);
      }

      // Generar respuesta usando IA
      const response = await this.generateResponse(query, searchResults, context);
      
      return {
        query,
        intent: queryIntent,
        results: searchResults,
        response,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error procesando consulta CRM:', error);
      return {
        query,
        intent: { type: 'error', confidence: 0 },
        results: null,
        response: 'Lo siento, hubo un error procesando tu consulta. Intenta de nuevo.',
        timestamp: new Date()
      };
    }
  }

  /**
   * Analiza el intent de la consulta usando IA
   */
  private async analyzeQueryIntent(query: string) {
    try {
      const prompt = `
Analiza la siguiente consulta y clasifícala:

Consulta: "${query}"

Responde SOLO con un JSON válido con esta estructura:
{
  "type": "searchEvents|searchClients|searchQuotes|general",
  "params": {
    "query": "texto relevante para búsqueda"
  },
  "confidence": 0.8
}

Guías:
- searchEvents: si menciona evento, celebración, reserva, fecha
- searchClients: si menciona cliente, contacto, persona
- searchQuotes: si menciona cotización, presupuesto, precio
- general: para cualquier otra consulta
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
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
        confidence: 0.5
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
          const searchOptions: any = {
            type: 'event',
            limit: params.limit || 10,
            tenantId: params.tenantId,
            includeEntity: true
          };
          
          if (params.businessIdentityId) {
            searchOptions.businessIdentityId = params.businessIdentityId;
          }

          const vectorResults = await crmEmbeddingService.searchSimilar(params.query, searchOptions);

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
                description: (result.entity as any).description
              }))
            };
          }
        } catch (vectorError) {
          console.log('Búsqueda vectorial falló, usando búsqueda tradicional:', vectorError);
        }
      }

      // Búsqueda tradicional como fallback
      const whereClause: any = {};
      
      if (params.query) {
        whereClause.OR = [
          { title: { contains: params.query, mode: 'insensitive' } },
          { description: { contains: params.query, mode: 'insensitive' } }
        ];
      }

      const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { startDate: 'desc' },
        take: params.limit || 10
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
          description: event.description,
          guestCount: event.guestCount
        }))
      };

    } catch (error) {
      console.error('Error en búsqueda de eventos:', error);
      return {
        total: 0,
        searchType: 'error',
        events: []
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
          const searchOptions: any = {
            type: 'client',
            limit: params.limit || 10,
            tenantId: params.tenantId,
            includeEntity: true
          };
          
          if (params.businessIdentityId) {
            searchOptions.businessIdentityId = params.businessIdentityId;
          }

          const vectorResults = await crmEmbeddingService.searchSimilar(params.query, searchOptions);

          if (vectorResults.length > 0) {
            return {
              total: vectorResults.length,
              searchType: 'semantic',
              clients: vectorResults.map(result => ({
                id: result.entity.id,
                name: (result.entity as any).name,
                email: (result.entity as any).email,
                phone: (result.entity as any).phone,
                similarity: result.similarity
              }))
            };
          }
        } catch (vectorError) {
          console.log('Búsqueda vectorial falló, usando búsqueda tradicional:', vectorError);
        }
      }

      // Búsqueda tradicional
      const whereClause: any = {};
      
      if (params.query) {
        whereClause.OR = [
          { name: { contains: params.query, mode: 'insensitive' } },
          { email: { contains: params.query, mode: 'insensitive' } },
          { company: { contains: params.query, mode: 'insensitive' } }
        ];
      }

      const clients = await prisma.client.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 10
      });

      return {
        total: clients.length,
        searchType: 'traditional',
        clients: clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          type: client.clientType
        }))
      };

    } catch (error) {
      console.error('Error en búsqueda de clientes:', error);
      return {
        total: 0,
        searchType: 'error',
        clients: []
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
          const searchOptions: any = {
            type: 'quote',
            limit: params.limit || 10,
            tenantId: params.tenantId,
            includeEntity: true
          };
          
          if (params.businessIdentityId) {
            searchOptions.businessIdentityId = params.businessIdentityId;
          }

          const vectorResults = await crmEmbeddingService.searchSimilar(params.query, searchOptions);

          if (vectorResults.length > 0) {
            return {
              total: vectorResults.length,
              searchType: 'semantic',
              quotes: vectorResults.map(result => ({
                id: result.entity.id,
                number: (result.entity as any).number || (result.entity as any).quoteNumber,
                status: (result.entity as any).status,
                total: Number((result.entity as any).total || 0),
                similarity: result.similarity
              }))
            };
          }
        } catch (vectorError) {
          console.log('Búsqueda vectorial falló, usando búsqueda tradicional:', vectorError);
        }
      }

      // Búsqueda tradicional
      const whereClause: any = {};
      
      if (params.query) {
        whereClause.OR = [
          { number: { contains: params.query, mode: 'insensitive' } },
          { notes: { contains: params.query, mode: 'insensitive' } }
        ];
      }

      const quotes = await prisma.quote.findMany({
        where: whereClause,
        include: {
          client: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 10
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
          client: quote.client ? {
            name: quote.client.name,
            email: quote.client.email
          } : null,
          validUntil: quote.validUntil,
          createdAt: quote.createdAt
        }))
      };

    } catch (error) {
      console.error('Error en búsqueda de cotizaciones:', error);
      return {
        total: 0,
        searchType: 'error',
        quotes: []
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
        includeEntity: true
      });

      // Separar resultados por tipo
      const groupedResults: any = {
        events: [],
        clients: [],
        quotes: [],
        products: []
      };

      results.forEach(result => {
        const resultData = {
          id: result.entity.id,
          similarity: result.similarity
        };

        // Intentar determinar el tipo de entidad por las propiedades
        if ((result.entity as any).title && (result.entity as any).startDate) {
          groupedResults.events.push({
            ...resultData,
            title: (result.entity as any).title,
            startDate: (result.entity as any).startDate,
            status: (result.entity as any).status
          });
        } else if ((result.entity as any).name && (result.entity as any).email) {
          groupedResults.clients.push({
            ...resultData,
            name: (result.entity as any).name,
            email: (result.entity as any).email
          });
        } else if ((result.entity as any).number || (result.entity as any).quoteNumber) {
          groupedResults.quotes.push({
            ...resultData,
            number: (result.entity as any).number || (result.entity as any).quoteNumber,
            status: (result.entity as any).status
          });
        }
      });

      return {
        total: results.length,
        searchType: 'semantic-general',
        ...groupedResults
      };

    } catch (error) {
      console.error('Error en búsqueda general:', error);
      return {
        total: 0,
        searchType: 'error',
        events: [],
        clients: [],
        quotes: [],
        products: []
      };
    }
  }

  /**
   * Genera respuesta usando IA basada en los resultados
   */
  private async generateResponse(query: string, results: any, context: any) {
    if (!results || results.total === 0) {
      return this.generateEmptyResponse(query);
    }

    try {
      const prompt = `
Eres un asistente del CRM Casona María. Responde de manera natural basándote en estos resultados:

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

      const result = await this.model.generateContent(prompt);
      return result.response.text();

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
}

// Instancia singleton del servicio
export const crmAgentService = new CRMAgentService();