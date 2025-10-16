import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { crmEmbeddingService } from './crm-embeddings';
import { SYSTEM_PROMPTS, RESPONSE_TEMPLATES } from './prompt-templates';
import { EventStatus, QuoteStatus, UserRole } from '@prisma/client';

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export interface AgentMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface AgentResponse {
  message: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result?: any;
  }>;
  conversationId?: string;
}

export interface CRMSearchParams {
  query?: string;
  limit?: number;
  tenantId?: string;
  businessIdentityId?: string;
}

export interface SearchEventsParams extends CRMSearchParams {
  clientName?: string;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
  roomId?: string;
}

export interface SearchQuotesParams extends CRMSearchParams {
  clientName?: string;
  status?: QuoteStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchClientsParams extends CRMSearchParams {
  name?: string;
  email?: string;
  type?: string;
}

export interface SearchProductsParams extends CRMSearchParams {
  category?: string;
  type?: string;
  isActive?: boolean;
}

export interface SearchRoomsParams extends CRMSearchParams {
  locationId?: string;
  capacity?: number;
  isActive?: boolean;
}

export class CRMAgentService {
  private model: any;
  private defaultTenantId: string;

  constructor(tenantId?: string) {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    });
    this.defaultTenantId = tenantId || '';
  }

  /**
   * Procesa un mensaje del usuario y genera respuesta
   */
  async processMessage(
    message: string,
    tenantId: string,
    userRole: UserRole = UserRole.USER,
    conversationId?: string,
    context?: AgentMessage[]
  ): Promise<AgentResponse> {
    try {
      this.defaultTenantId = tenantId;

      // Crear sistema de prompts personalizado por rol
      const systemPrompt = this.getSystemPromptByRole(userRole);
      
      // Preparar historial de conversación
      const history: AgentMessage[] = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model', 
          parts: [{ text: 'Entendido. Soy EventBot, tu asistente del CRM Casona María V3.0. ¿En qué puedo ayudarte?' }]
        }
      ];

      if (context && context.length > 0) {
        history.push(...context);
      }

      // Detectar si necesita usar funciones
      const needsFunctionCall = await this.detectFunctionCall(message);
      
      if (needsFunctionCall.needed) {
        // Ejecutar función detectada
        const functionResult = await this.executeCRMFunction(
          needsFunctionCall.function,
          needsFunctionCall.params,
          tenantId
        );

        // Generar respuesta con los datos obtenidos
        const prompt = `
Basándote en los siguientes datos obtenidos de la función ${needsFunctionCall.function}:

${JSON.stringify(functionResult, null, 2)}

Responde a la pregunta del usuario: "${message}"

Proporciona una respuesta clara, estructurada y útil usando estos datos.
`;

        const result = await this.model.generateContent(prompt);
        const response = result.response;

        return {
          message: response.text(),
          functionCalls: [{
            name: needsFunctionCall.function,
            args: needsFunctionCall.params,
            result: functionResult
          }],
          conversationId
        };
      }

      // Respuesta directa sin funciones
      const chat = this.model.startChat({ history });
      const result = await chat.sendMessage(message);
      const response = result.response;

      return {
        message: response.text(),
        conversationId
      };

    } catch (error) {
      console.error('Error procesando mensaje CRM:', error);
      return {
        message: RESPONSE_TEMPLATES.ERROR,
        conversationId
      };
    }
  }

  /**
   * Detecta si el mensaje requiere llamar a una función
   */
  private async detectFunctionCall(message: string): Promise<{
    needed: boolean;
    function?: string;
    params?: Record<string, any>;
  }> {
    const detectionPrompt = `
Analiza este mensaje y determina si necesita datos específicos del CRM:

Mensaje: "${message}"

Funciones disponibles:
- searchEvents: Para buscar eventos
- searchClients: Para buscar clientes  
- searchQuotes: Para buscar cotizaciones
- searchProducts: Para buscar productos/servicios
- searchRooms: Para buscar salas
- getDashboardStats: Para estadísticas
- analyzeBusinessData: Para análisis de negocio

Responde SOLO con formato JSON:
{
  "needed": true/false,
  "function": "nombre_funcion",
  "params": { ... }
}
`;

    try {
      const result = await this.model.generateContent(detectionPrompt);
      const response = result.response.text();
      
      // Extraer JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error detectando función:', error);
    }

    return { needed: false };
  }

  /**
   * Ejecuta función específica del CRM
   */
  private async executeCRMFunction(
    functionName: string,
    params: Record<string, any>,
    tenantId: string
  ): Promise<any> {
    const baseWhere = { tenantId };

    switch (functionName) {
      case 'searchEvents':
        return this.searchEvents({ ...params, tenantId });

      case 'searchClients':
        return this.searchClients({ ...params, tenantId });

      case 'searchQuotes':
        return this.searchQuotes({ ...params, tenantId });

      case 'searchProducts':
        return this.searchProducts({ ...params, tenantId });

      case 'searchRooms':
        return this.searchRooms({ ...params, tenantId });

      case 'getDashboardStats':
        return this.getDashboardStats(params.period || 30, tenantId, params.businessIdentityId);

      case 'analyzeBusinessData':
        return this.analyzeBusinessData(params.analysisType, params.period || 90, tenantId);

      default:
        throw new Error(`Función no reconocida: ${functionName}`);
    }
  }

  /**
   * Busca eventos en el CRM usando búsqueda semántica y filtros
   */
  private async searchEvents(params: SearchEventsParams) {
    // Si hay query de texto, usar búsqueda semántica
    if (params.query) {
      const vectorResults = await crmEmbeddingService.searchSimilar(params.query, {
        type: 'event',
        limit: params.limit || 10,
        tenantId: params.tenantId,
        businessIdentityId: params.businessIdentityId,
        includeEntity: true
      });

      // Filtrar resultados por criterios adicionales
      const filteredResults = vectorResults.filter(result => {
        const event = result.entity;
        if (!event) return false;

        if (params.status && event.status !== params.status) return false;
        if (params.roomId && event.roomId !== params.roomId) return false;
        if (params.clientName && !event.client?.name.toLowerCase().includes(params.clientName.toLowerCase())) return false;
        
        if (params.dateFrom || params.dateTo) {
          const eventDate = new Date(event.startDate);
          if (params.dateFrom && eventDate < new Date(params.dateFrom)) return false;
          if (params.dateTo && eventDate > new Date(params.dateTo)) return false;
        }

        return true;
      });

      return {
        total: filteredResults.length,
        searchType: 'semantic',
        events: filteredResults.map(result => ({
          id: result.entity.id,
          title: result.entity.title,
          startDate: result.entity.startDate,
          endDate: result.entity.endDate,
          status: result.entity.status,
          similarity: result.similarity,
          client: result.entity.client ? {
            name: result.entity.client.name,
            email: result.entity.client.email,
            type: result.entity.client.type
          } : null,
          room: result.entity.room ? {
            name: result.entity.room.name,
            location: result.entity.room.location?.name,
            businessIdentity: result.entity.room.location?.businessIdentity?.name
          } : null,
          notes: result.entity.notes
        }))
      };
    }

    // Búsqueda tradicional por filtros
    const where: Record<string, any> = {
      tenantId: params.tenantId
    };

    if (params.clientName) {
      where.client = {
        name: { contains: params.clientName, mode: 'insensitive' }
      };
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.roomId) {
      where.roomId = params.roomId;
    }

    if (params.dateFrom || params.dateTo) {
      where.startDate = {};
      if (params.dateFrom) where.startDate.gte = new Date(params.dateFrom);
      if (params.dateTo) where.startDate.lte = new Date(params.dateTo);
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, type: true }
        },
        room: {
          include: {
            location: {
              include: {
                businessIdentity: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { startDate: 'desc' },
      take: params.limit || 10
    });

    return {
      total: events.length,
      searchType: 'filter',
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        client: event.client ? {
          name: event.client.name,
          email: event.client.email,
          type: event.client.type
        } : null,
        room: event.room ? {
          name: event.room.name,
          location: event.room.location?.name,
          businessIdentity: event.room.location?.businessIdentity?.name
        } : null,
        notes: event.notes
      }))
    };
  }

  /**
   * Busca clientes en el CRM usando búsqueda semántica y filtros
   */
  private async searchClients(params: SearchClientsParams) {
    // Si hay query de texto, usar búsqueda semántica
    if (params.query) {
      const vectorResults = await crmEmbeddingService.searchSimilar(params.query, {
        type: 'client',
        limit: params.limit || 10,
        tenantId: params.tenantId,
        businessIdentityId: params.businessIdentityId,
        includeEntity: true
      });

      // Filtrar resultados por criterios adicionales
      const filteredResults = vectorResults.filter(result => {
        const client = result.entity;
        if (!client) return false;

        if (params.type && client.type !== params.type) return false;
        if (params.name && !client.name.toLowerCase().includes(params.name.toLowerCase())) return false;
        if (params.email && !client.email?.toLowerCase().includes(params.email.toLowerCase())) return false;

        return true;
      });

      return {
        total: filteredResults.length,
        searchType: 'semantic',
        clients: filteredResults.map(result => ({
          id: result.entity.id,
          name: result.entity.name,
          email: result.entity.email,
          phone: result.entity.phone,
          type: result.entity.type,
          similarity: result.similarity,
          priceList: result.entity.priceList?.name,
          totalEvents: result.entity._count?.events || 0,
          totalQuotes: result.entity._count?.quotes || 0,
          createdAt: result.entity.createdAt
        }))
      };
    }

    // Búsqueda tradicional por filtros
    const where: Record<string, any> = {
      tenantId: params.tenantId
    };

    if (params.name) {
      where.name = { contains: params.name, mode: 'insensitive' };
    }

    if (params.email) {
      where.email = { contains: params.email, mode: 'insensitive' };
    }

    if (params.type) {
      where.type = params.type;
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        priceList: {
          select: { id: true, name: true, type: true }
        },
        _count: {
          select: {
            events: true,
            quotes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 10
    });

    return {
      total: clients.length,
      searchType: 'filter',
      clients: clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: client.type,
        priceList: client.priceList?.name,
        totalEvents: client._count.events,
        totalQuotes: client._count.quotes,
        createdAt: client.createdAt
      }))
    };
  }

  /**
   * Busca cotizaciones en el CRM
   */
  private async searchQuotes(params: SearchQuotesParams) {
    // Si hay query de texto, usar búsqueda semántica
    if (params.query) {
      const searchOptions: any = {
        type: 'quote',
        limit: params.limit || 10,
        tenantId: params.tenantId!,
        includeEntity: true
      };
      
      if (params.businessIdentityId) {
        searchOptions.businessIdentityId = params.businessIdentityId;
      }

      const vectorResults = await crmEmbeddingService.searchSimilar(params.query, searchOptions);

      // Filtrar resultados por criterios adicionales
      const filteredResults = vectorResults.filter(result => {
        const quote = result.entity;
        if (!quote) return false;

        if (params.status && quote.status !== params.status) return false;
        if (params.clientName && !quote.client?.name.toLowerCase().includes(params.clientName.toLowerCase())) return false;
        
        if (params.dateFrom || params.dateTo) {
          const quoteDate = new Date(quote.createdAt);
          if (params.dateFrom && quoteDate < new Date(params.dateFrom)) return false;
          if (params.dateTo && quoteDate > new Date(params.dateTo)) return false;
        }

        return true;
      });

      return {
        total: filteredResults.length,
        searchType: 'semantic',
        quotes: filteredResults.map(result => ({
          id: result.entity.id,
          quoteNumber: (result.entity as any).quoteNumber || (result.entity as any).number,
          status: result.entity.status,
          total: Number(result.entity.total),
          subtotal: Number(result.entity.subtotal),
          similarity: result.similarity,
          client: (result.entity as any).client ? {
            name: (result.entity as any).client.name,
            email: (result.entity as any).client.email
          } : null,
          event: (result.entity as any).event ? {
            title: (result.entity as any).event.title,
            date: (result.entity as any).event.startDate,
            room: (result.entity as any).event.room?.name,
            location: (result.entity as any).event.room?.location?.name
          } : null,
          validUntil: result.entity.validUntil,
          createdAt: result.entity.createdAt
        }))
      };
    }

    // Búsqueda tradicional por filtros
    const where: Record<string, any> = {
      tenantId: params.tenantId
    };

    if (params.clientName) {
      where['client'] = {
        name: { contains: params.clientName, mode: 'insensitive' }
      };
    }

    if (params.status) {
      where['status'] = params.status;
    }

    if (params.businessIdentityId) {
      where['businessIdentityId'] = params.businessIdentityId;
    }

    if (params.dateFrom || params.dateTo) {
      where['createdAt'] = {};
      if (params.dateFrom) where['createdAt'].gte = new Date(params.dateFrom);
      if (params.dateTo) where['createdAt'].lte = new Date(params.dateTo);
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true }
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
        }
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 10
    });

    return {
      total: quotes.length,
      searchType: 'filter',
      quotes: quotes.map((quote: any) => ({
        id: quote.id,
        quoteNumber: quote.quoteNumber || quote.number,
        status: quote.status,
        total: Number(quote.total),
        subtotal: Number(quote.subtotal),
        client: quote.client ? {
          name: quote.client.name,
          email: quote.client.email
        } : null,
        event: quote.event ? {
          title: quote.event.title,
          date: quote.event.startDate,
          room: quote.event.room?.name,
          location: quote.event.room?.location?.name
        } : null,
        validUntil: quote.validUntil,
        createdAt: quote.createdAt
      }))
    };
  }

  /**
   * Busca productos y servicios
   */
  private async searchProducts(params: SearchProductsParams) {
    const where: Record<string, any> = {
      tenantId: params.tenantId
    };

    if (params.category) {
      where['category'] = { contains: params.category, mode: 'insensitive' };
    }

    if (params.type) {
      where['type'] = params.type;
    }

    if (params.isActive !== undefined) {
      where['isActive'] = params.isActive;
    }

    if (params.query) {
      where['OR'] = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        prices: {
          include: {
            priceList: {
              select: { name: true, type: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
      take: params.limit || 20
    });

    return {
      total: products.length,
      products: products.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        unit: product.unit,
        isActive: product.isActive,
        prices: product.prices?.map((price: any) => ({
          priceList: price.priceList.name,
          price: Number(price.price)
        })) || []
      }))
    };
  }

  /**
   * Busca salas disponibles
   */
  private async searchRooms(params: SearchRoomsParams) {
    const where: Record<string, any> = {
      location: {
        businessIdentity: {
          tenantId: params.tenantId
        }
      }
    };

    if (params.businessIdentityId) {
      where.location.businessIdentityId = params.businessIdentityId;
    }

    if (params.locationId) {
      where.locationId = params.locationId;
    }

    if (params.capacity) {
      where.capacity = { gte: params.capacity };
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } }
      ];
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        location: {
          include: {
            businessIdentity: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: {
            events: {
              where: {
                status: { in: [EventStatus.RESERVED, EventStatus.QUOTED, EventStatus.CONFIRMED] }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
      take: params.limit || 10
    });

    return {
      total: rooms.length,
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        description: room.description,
        color: room.color,
        isActive: room.isActive,
        location: room.location?.name,
        businessIdentity: room.location?.businessIdentity?.name,
        activeEventsCount: room._count.events
      }))
    };
  }

  /**
   * Obtiene estadísticas del dashboard
   */
  private async getDashboardStats(period: number, tenantId: string, businessIdentityId?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const baseWhere: Record<string, any> = {
      tenantId,
      createdAt: { gte: startDate }
    };

    if (businessIdentityId) {
      baseWhere.businessIdentityId = businessIdentityId;
    }

    const [
      totalClients,
      totalEvents,
      totalQuotes,
      revenueStats,
      eventsByStatus,
      quotesByStatus
    ] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.event.count({ where: baseWhere }),
      prisma.quote.count({ where: baseWhere }),
      prisma.quote.aggregate({
        where: {
          ...baseWhere,
          status: { in: [QuoteStatus.APPROVED, QuoteStatus.SENT_TO_CLIENT, QuoteStatus.ACCEPTED] }
        },
        _sum: { total: true },
        _avg: { total: true }
      }),
      prisma.event.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true
      }),
      prisma.quote.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true
      })
    ]);

    return {
      period,
      summary: {
        totalClients,
        totalEvents,  
        totalQuotes,
        totalRevenue: Number(revenueStats._sum.total || 0),
        avgQuoteValue: Number(revenueStats._avg.total || 0)
      },
      charts: {
        eventsByStatus: eventsByStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
        quotesByStatus: quotesByStatus.map(item => ({
          status: item.status,
          count: item._count
        }))
      }
    };
  }

  /**
   * Analiza datos del negocio
   */
  private async analyzeBusinessData(analysisType: string, period: number, tenantId: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    switch (analysisType) {
      case 'revenue_trends':
        return this.analyzeRevenueTrends(startDate, tenantId);
      case 'client_analysis':
        return this.analyzeClients(startDate, tenantId);
      case 'quote_conversion':
        return this.analyzeQuoteConversion(startDate, tenantId);
      default:
        return { error: 'Tipo de análisis no soportado' };
    }
  }

  private async analyzeRevenueTrends(startDate: Date, tenantId: string) {
    const quotes = await prisma.quote.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
        status: { in: [QuoteStatus.APPROVED, QuoteStatus.ACCEPTED] }
      },
      select: {
        total: true,
        createdAt: true,
        businessIdentity: {
          select: { name: true }
        }
      }
    });

    const totalRevenue = quotes.reduce((sum, quote) => sum + Number(quote.total), 0);
    const avgQuoteValue = totalRevenue / (quotes.length || 1);

    return {
      analysisType: 'revenue_trends',
      totalRevenue,
      avgQuoteValue,
      quotesCount: quotes.length,
      revenueByIdentity: quotes.reduce((acc: Record<string, number>, quote) => {
        const identity = quote.businessIdentity.name;
        acc[identity] = (acc[identity] || 0) + Number(quote.total);
        return acc;
      }, {})
    };
  }

  private async analyzeClients(startDate: Date, tenantId: string) {
    const clients = await prisma.client.findMany({
      where: { tenantId },
      include: {
        quotes: {
          where: {
            createdAt: { gte: startDate },
            status: { in: [QuoteStatus.APPROVED, QuoteStatus.ACCEPTED] }
          }
        },
        events: {
          where: { createdAt: { gte: startDate } }
        }
      }
    });

    const clientAnalysis = clients.map(client => ({
      id: client.id,
      name: client.name,
      type: client.type,
      totalRevenue: client.quotes.reduce((sum, quote) => sum + Number(quote.total), 0),
      quotesCount: client.quotes.length,
      eventsCount: client.events.length
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      analysisType: 'client_analysis',
      totalClients: clients.length,
      topClients: clientAnalysis.slice(0, 10),
      clientsByType: clients.reduce((acc: Record<string, number>, client) => {
        acc[client.type] = (acc[client.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  private async analyzeQuoteConversion(startDate: Date, tenantId: string) {
    const quotes = await prisma.quote.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate }
      },
      select: { status: true }
    });

    const statusCounts = quotes.reduce((acc: Record<string, number>, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {});

    const totalQuotes = quotes.length;
    const acceptedQuotes = statusCounts[QuoteStatus.ACCEPTED] || 0;
    const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    return {
      analysisType: 'quote_conversion',
      totalQuotes,
      acceptedQuotes,
      conversionRate: Math.round(conversionRate * 100) / 100,
      statusBreakdown: statusCounts
    };
  }

  /**
   * Obtiene prompts personalizados por rol
   */
  private getSystemPromptByRole(role: UserRole): string {
    const basePrompt = SYSTEM_PROMPTS.MAIN_ASSISTANT;
    
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return `${basePrompt}\n\n🔧 MODO SUPER_ADMIN: Acceso completo a todos los datos multi-tenant, análisis avanzados y configuraciones del sistema.`;
      
      case UserRole.TENANT_ADMIN:
        return `${basePrompt}\n\n👑 MODO TENANT_ADMIN: Gestión completa del tenant, todas las identidades de negocio y configuraciones organizacionales.`;
      
      case UserRole.MANAGER:
        return `${basePrompt}\n\n📊 MODO MANAGER: Enfoque en aprobaciones de cotizaciones, análisis de rendimiento y gestión operativa.`;
      
      case UserRole.USER:
        return `${basePrompt}\n\n💼 MODO USER: Operación diaria de eventos, clientes y cotizaciones básicas.`;
      
      case UserRole.CLIENT_EXTERNAL:
        return `${basePrompt}\n\n👤 MODO CLIENT_EXTERNAL: Vista limitada a datos propios, eventos y cotizaciones del cliente.`;
      
      default:
        return basePrompt;
    }
  }
}

// Instancia singleton del servicio
export const crmAgentService = new CRMAgentService();