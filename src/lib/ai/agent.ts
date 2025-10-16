import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { vectorSearchService } from './vector-search';
import { SYSTEM_PROMPTS, RESPONSE_TEMPLATES } from './prompt-templates';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface AgentResponse {
  message: string;
  functionCalls?: any[];
  conversationId?: string;
}

export interface SearchEventsParams {
  query?: string;
  clientName?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  limit?: number;
}

export interface SearchClientsParams {
  query?: string;
  name?: string;
  email?: string;
  company?: string;
  limit?: number;
}

export interface CheckAvailabilityParams {
  venueId?: string;
  venueName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
}

export interface GenerateQuoteParams {
  eventType: string;
  guestCount: number;
  date: string;
  venueId?: string;
  duration?: number;
  services?: string[];
}

export class EventAgentService {
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.temperature = 0.7;
    this.maxTokens = 1500;
  }

  /**
   * Procesa un mensaje del usuario y genera respuesta
   */
  async processMessage(
    message: string, 
    conversationId?: string,
    context?: any[]
  ): Promise<AgentResponse> {
    try {
      const messages: AgentMessage[] = [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.MAIN_ASSISTANT
        }
      ];

      // Agregar contexto de conversación si existe
      if (context && context.length > 0) {
        messages.push(...context);
      }

      // Agregar mensaje del usuario
      messages.push({
        role: 'user',
        content: message
      });

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        functions: this.getFunctionDefinitions(),
        function_call: 'auto',
      });

      const choice = response.choices[0];
      
      if (choice.message.function_call) {
        // Ejecutar función solicitada
        const functionResult = await this.executeFunctionCall(choice.message.function_call);
        
        // Generar respuesta final con el resultado de la función
        const finalMessages = [
          ...messages,
          choice.message as any,
          {
            role: 'function',
            name: choice.message.function_call.name,
            content: JSON.stringify(functionResult)
          }
        ];

        const finalResponse = await openai.chat.completions.create({
          model: this.model,
          messages: finalMessages as any,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        });

        return {
          message: finalResponse.choices[0].message.content || 'Lo siento, no pude procesar tu solicitud.',
          functionCalls: [choice.message.function_call],
          conversationId
        };
      }

      return {
        message: choice.message.content || 'Lo siento, no pude procesar tu solicitud.',
        conversationId
      };

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return {
        message: RESPONSE_TEMPLATES.ERROR,
        conversationId
      };
    }
  }

  /**
   * Define las funciones disponibles para el agente
   */
  private getFunctionDefinitions() {
    return [
      {
        name: 'searchEvents',
        description: 'Busca eventos en la base de datos usando criterios específicos',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto libre para búsqueda semántica' },
            clientName: { type: 'string', description: 'Nombre del cliente' },
            eventType: { type: 'string', description: 'Tipo de evento' },
            dateFrom: { type: 'string', description: 'Fecha de inicio (YYYY-MM-DD)' },
            dateTo: { type: 'string', description: 'Fecha de fin (YYYY-MM-DD)' },
            status: { type: 'string', description: 'Estado del evento' },
            limit: { type: 'number', description: 'Número máximo de resultados' }
          }
        }
      },
      {
        name: 'searchClients',
        description: 'Busca clientes en la base de datos',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto libre para búsqueda semántica' },
            name: { type: 'string', description: 'Nombre del cliente' },
            email: { type: 'string', description: 'Email del cliente' },
            company: { type: 'string', description: 'Empresa del cliente' },
            limit: { type: 'number', description: 'Número máximo de resultados' }
          },
          required: []
        }
      },
      {
        name: 'searchVenues',
        description: 'Busca venues/espacios disponibles',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto libre para búsqueda semántica' },
            capacity: { type: 'number', description: 'Capacidad mínima requerida' },
            type: { type: 'string', description: 'Tipo de venue' },
            limit: { type: 'number', description: 'Número máximo de resultados' }
          }
        }
      },
      {
        name: 'checkAvailability',
        description: 'Verifica disponibilidad de un venue en fecha específica',
        parameters: {
          type: 'object',
          properties: {
            venueId: { type: 'string', description: 'ID del venue' },
            venueName: { type: 'string', description: 'Nombre del venue' },
            date: { type: 'string', description: 'Fecha a verificar (YYYY-MM-DD)' },
            startTime: { type: 'string', description: 'Hora de inicio (HH:MM)' },
            endTime: { type: 'string', description: 'Hora de fin (HH:MM)' },
            guestCount: { type: 'number', description: 'Número de invitados' }
          },
          required: ['date']
        }
      },
      {
        name: 'generateQuote',
        description: 'Genera una cotización preliminar',
        parameters: {
          type: 'object',
          properties: {
            eventType: { type: 'string', description: 'Tipo de evento' },
            guestCount: { type: 'number', description: 'Número de invitados' },
            date: { type: 'string', description: 'Fecha del evento (YYYY-MM-DD)' },
            venueId: { type: 'string', description: 'ID del venue seleccionado' },
            duration: { type: 'number', description: 'Duración en horas' },
            services: { type: 'array', items: { type: 'string' }, description: 'Servicios adicionales' }
          },
          required: ['eventType', 'guestCount', 'date']
        }
      },
      {
        name: 'getEventDetails',
        description: 'Obtiene detalles completos de un evento específico',
        parameters: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'ID del evento' },
            eventName: { type: 'string', description: 'Nombre del evento' }
          }
        }
      },
      {
        name: 'searchQuotes',
        description: 'Busca cotizaciones en el CRM con filtros avanzados',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto libre para búsqueda semántica' },
            status: { 
              type: 'string', 
              description: 'Estado de la cotización',
              enum: ['DRAFT', 'PENDING_MANAGER', 'APPROVED', 'SENT_TO_CLIENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
            },
            clientName: { type: 'string', description: 'Nombre del cliente' },
            dateFrom: { type: 'string', description: 'Fecha desde (YYYY-MM-DD)' },
            dateTo: { type: 'string', description: 'Fecha hasta (YYYY-MM-DD)' },
            businessIdentityId: { type: 'string', description: 'ID de identidad de negocio' },
            limit: { type: 'number', description: 'Número máximo de resultados', default: 10 }
          }
        }
      },
      {
        name: 'searchProducts',
        description: 'Busca productos y servicios en el catálogo CRM',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto libre para búsqueda' },
            category: { type: 'string', description: 'Categoría del producto/servicio' },
            type: { 
              type: 'string', 
              description: 'Tipo de item',
              enum: ['PRODUCT', 'SERVICE', 'PACKAGE']
            },
            isActive: { type: 'boolean', description: 'Solo items activos', default: true },
            limit: { type: 'number', description: 'Número máximo de resultados', default: 20 }
          }
        }
      },
      {
        name: 'searchRooms',
        description: 'Busca salas y espacios en el CRM por ubicación e identidad',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto libre para búsqueda' },
            businessIdentityId: { type: 'string', description: 'ID de identidad de negocio' },
            locationId: { type: 'string', description: 'ID de ubicación' },
            capacity: { type: 'number', description: 'Capacidad mínima requerida' },
            isActive: { type: 'boolean', description: 'Solo salas activas', default: true },
            limit: { type: 'number', description: 'Número máximo de resultados', default: 10 }
          }
        }
      },
      {
        name: 'getDashboardStats',
        description: 'Obtiene estadísticas del dashboard CRM para análisis de negocio',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'number', description: 'Período en días para estadísticas', default: 30 },
            businessIdentityId: { type: 'string', description: 'ID de identidad de negocio específica' }
          }
        }
      },
      {
        name: 'analyzeBusinessData',  
        description: 'Analiza datos del negocio para obtener insights y tendencias',
        parameters: {
          type: 'object',
          properties: {
            analysisType: {
              type: 'string',
              description: 'Tipo de análisis a realizar',
              enum: ['revenue_trends', 'client_analysis', 'event_patterns', 'quote_conversion', 'room_utilization']
            },
            period: { type: 'number', description: 'Período en días', default: 90 },
            businessIdentityId: { type: 'string', description: 'ID de identidad de negocio' }
          },
          required: ['analysisType']
        }
      }
    ];
  }

  /**
   * Ejecuta la función llamada por el agente
   */
  private async executeFunctionCall(functionCall: any) {
    const { name, arguments: args } = functionCall;
    const params = JSON.parse(args);

    switch (name) {
      case 'searchEvents':
        return await this.searchEvents(params);
      case 'searchClients':
        return await this.searchClients(params);
      case 'searchVenues':
        return await this.searchVenues(params);
      case 'checkAvailability':
        return await this.checkAvailability(params);
      case 'generateQuote':
        return await this.generateQuote(params);
      case 'getEventDetails':
        return await this.getEventDetails(params);
      default:
        throw new Error(`Función desconocida: ${name}`);
    }
  }

  /**
   * Busca eventos usando criterios específicos
   */
  private async searchEvents(params: SearchEventsParams) {
    try {
      let events;

      if (params.query) {
        // Búsqueda semántica
        const searchResults = await vectorSearchService.searchSimilar(params.query, {
          type: 'event',
          limit: params.limit || 10
        });

        const eventIds = searchResults.map(r => r.entityId);
        events = await prisma.event.findMany({
          where: { id: { in: eventIds } },
          include: {
            client: true,
            venue: true,
            eventType: true,
          },
          take: params.limit || 10
        });
      } else {
        // Búsqueda por criterios específicos
        const where: any = {};

        if (params.clientName) {
          where.client = {
            name: { contains: params.clientName, mode: 'insensitive' }
          };
        }

        if (params.eventType) {
          where.eventType = {
            name: { contains: params.eventType, mode: 'insensitive' }
          };
        }

        if (params.dateFrom || params.dateTo) {
          where.eventDate = {};
          if (params.dateFrom) where.eventDate.gte = new Date(params.dateFrom);
          if (params.dateTo) where.eventDate.lte = new Date(params.dateTo);
        }

        if (params.status) {
          where.status = params.status;
        }

        events = await prisma.event.findMany({
          where,
          include: {
            client: true,
            venue: true,
            eventType: true,
          },
          take: params.limit || 10,
          orderBy: { eventDate: 'desc' }
        });
      }

      return {
        events: events.map(event => ({
          id: event.id,
          name: event.name,
          description: event.description,
          eventDate: event.eventDate,
          status: event.status,
          budget: event.budget,
          client: event.client ? {
            name: event.client.name,
            email: event.client.email
          } : null,
          venue: event.venue ? {
            name: event.venue.name,
            location: event.venue.location
          } : null,
          eventType: event.eventType?.name
        })),
        count: events.length
      };
    } catch (error) {
      console.error('Error buscando eventos:', error);
      throw error;
    }
  }

  /**
   * Busca clientes
   */
  private async searchClients(params: SearchClientsParams) {
    try {
      let clients;

      if (params.query) {
        // Búsqueda semántica
        const searchResults = await vectorSearchService.searchSimilar(params.query, {
          type: 'client',
          limit: params.limit || 10
        });

        const clientIds = searchResults.map(r => r.entityId);
        clients = await prisma.client.findMany({
          where: { id: { in: clientIds } },
          include: {
            _count: { select: { events: true } }
          },
          take: params.limit || 10
        });
      } else {
        // Búsqueda por criterios
        const where: any = {};

        if (params.name) {
          where.name = { contains: params.name, mode: 'insensitive' };
        }

        if (params.email) {
          where.email = { contains: params.email, mode: 'insensitive' };
        }

        if (params.company) {
          where.company = { contains: params.company, mode: 'insensitive' };
        }

        clients = await prisma.client.findMany({
          where,
          include: {
            _count: { select: { events: true } }
          },
          take: params.limit || 10
        });
      }

      return {
        clients: clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          eventCount: client._count.events
        })),
        count: clients.length
      };
    } catch (error) {
      console.error('Error buscando clientes:', error);
      throw error;
    }
  }

  /**
   * Busca venues
   */
  private async searchVenues(params: any) {
    try {
      let venues;

      if (params.query) {
        // Búsqueda semántica
        const searchResults = await vectorSearchService.searchSimilar(params.query, {
          type: 'venue',
          limit: params.limit || 10
        });

        const venueIds = searchResults.map(r => r.entityId);
        venues = await prisma.venue.findMany({
          where: { id: { in: venueIds } },
          take: params.limit || 10
        });
      } else {
        // Búsqueda por criterios
        const where: any = {};

        if (params.capacity) {
          where.capacity = { gte: params.capacity };
        }

        if (params.type) {
          where.type = { contains: params.type, mode: 'insensitive' };
        }

        venues = await prisma.venue.findMany({
          where,
          take: params.limit || 10
        });
      }

      return {
        venues: venues.map(venue => ({
          id: venue.id,
          name: venue.name,
          location: venue.location,
          capacity: venue.capacity,
          pricePerHour: venue.pricePerHour,
          type: venue.type,
          amenities: venue.amenities
        })),
        count: venues.length
      };
    } catch (error) {
      console.error('Error buscando venues:', error);
      throw error;
    }
  }

  /**
   * Verifica disponibilidad de venue
   */
  private async checkAvailability(params: CheckAvailabilityParams) {
    try {
      let venue;

      if (params.venueId) {
        venue = await prisma.venue.findUnique({
          where: { id: params.venueId }
        });
      } else if (params.venueName) {
        venue = await prisma.venue.findFirst({
          where: { name: { contains: params.venueName, mode: 'insensitive' } }
        });
      }

      if (!venue) {
        return { available: false, error: 'Venue no encontrado' };
      }

      // Verificar eventos en la fecha
      const requestDate = new Date(params.date);
      const dayStart = new Date(requestDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(requestDate.setHours(23, 59, 59, 999));

      const conflictingEvents = await prisma.event.findMany({
        where: {
          venueId: venue.id,
          eventDate: {
            gte: dayStart,
            lte: dayEnd
          },
          status: { in: ['confirmed', 'pending'] }
        }
      });

      const available = conflictingEvents.length === 0;

      return {
        available,
        venue: {
          id: venue.id,
          name: venue.name,
          capacity: venue.capacity,
          pricePerHour: venue.pricePerHour
        },
        conflictingEvents: conflictingEvents.map(e => ({
          name: e.name,
          date: e.eventDate,
          status: e.status
        })),
        capacityCheck: params.guestCount ? venue.capacity >= params.guestCount : true
      };
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      throw error;
    }
  }

  /**
   * Genera cotización preliminar
   */
  private async generateQuote(params: GenerateQuoteParams) {
    try {
      let venue;
      
      if (params.venueId) {
        venue = await prisma.venue.findUnique({
          where: { id: params.venueId }
        });
      } else {
        // Buscar venue apropiado por capacidad
        venue = await prisma.venue.findFirst({
          where: { capacity: { gte: params.guestCount } },
          orderBy: { pricePerHour: 'asc' }
        });
      }

      if (!venue) {
        return { error: 'No se encontró un venue apropiado' };
      }

      const duration = params.duration || 8; // 8 horas por defecto
      const items = [];

      // Costo del venue
      items.push({
        description: `${venue.name} (${duration} horas)`,
        amount: venue.pricePerHour * duration,
        category: 'venue'
      });

      // Servicios básicos según tipo de evento
      const eventTypeServices = this.getEventTypeServices(params.eventType, params.guestCount);
      items.push(...eventTypeServices);

      // Servicios adicionales
      if (params.services) {
        const additionalServices = this.getAdditionalServices(params.services, params.guestCount);
        items.push(...additionalServices);
      }

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const tax = subtotal * 0.12; // IVA 12%
      const total = subtotal + tax;

      return {
        eventType: params.eventType,
        guestCount: params.guestCount,
        date: params.date,
        venue: venue.name,
        duration,
        items,
        subtotal,
        tax,
        total,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      };
    } catch (error) {
      console.error('Error generando cotización:', error);
      throw error;
    }
  }

  /**
   * Obtiene detalles completos de un evento
   */
  private async getEventDetails(params: any) {
    try {
      let event;

      if (params.eventId) {
        event = await prisma.event.findUnique({
          where: { id: params.eventId },
          include: {
            client: true,
            venue: true,
            eventType: true,
            quotes: true,
            tasks: true
          }
        });
      } else if (params.eventName) {
        event = await prisma.event.findFirst({
          where: { name: { contains: params.eventName, mode: 'insensitive' } },
          include: {
            client: true,
            venue: true,
            eventType: true,
            quotes: true,
            tasks: true
          }
        });
      }

      if (!event) {
        return { error: 'Evento no encontrado' };
      }

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        status: event.status,
        budget: event.budget,
        guestCount: event.guestCount,
        client: {
          name: event.client?.name,
          email: event.client?.email,
          phone: event.client?.phone
        },
        venue: {
          name: event.venue?.name,
          location: event.venue?.location,
          capacity: event.venue?.capacity
        },
        eventType: event.eventType?.name,
        quotes: event.quotes?.length || 0,
        tasks: event.tasks?.length || 0,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      };
    } catch (error) {
      console.error('Error obteniendo detalles del evento:', error);
      throw error;
    }
  }

  /**
   * Obtiene servicios base según el tipo de evento
   */
  private getEventTypeServices(eventType: string, guestCount: number) {
    const services = [];
    const type = eventType.toLowerCase();

    if (type.includes('boda')) {
      services.push(
        { description: `Sillas (${guestCount})`, amount: guestCount * 10, category: 'furniture' },
        { description: `Mesas redondas (${Math.ceil(guestCount / 8)})`, amount: Math.ceil(guestCount / 8) * 50, category: 'furniture' },
        { description: 'Servicio de meseros', amount: Math.ceil(guestCount / 20) * 200, category: 'service' },
        { description: 'Decoración básica', amount: 1000, category: 'decoration' }
      );
    } else if (type.includes('corporativo') || type.includes('empresa')) {
      services.push(
        { description: `Sillas (${guestCount})`, amount: guestCount * 8, category: 'furniture' },
        { description: 'Equipo de sonido básico', amount: 500, category: 'equipment' },
        { description: 'Proyector y pantalla', amount: 300, category: 'equipment' }
      );
    } else {
      // Evento general
      services.push(
        { description: `Sillas (${guestCount})`, amount: guestCount * 8, category: 'furniture' },
        { description: `Mesas (${Math.ceil(guestCount / 10)})`, amount: Math.ceil(guestCount / 10) * 40, category: 'furniture' }
      );
    }

    return services;
  }

  /**
   * Obtiene servicios adicionales
   */
  private getAdditionalServices(services: string[], guestCount: number) {
    const additionalServices = [];

    for (const service of services) {
      const serviceLower = service.toLowerCase();
      
      if (serviceLower.includes('catering')) {
        additionalServices.push({
          description: `Catering (${guestCount} personas)`,
          amount: guestCount * 50,
          category: 'catering'
        });
      } else if (serviceLower.includes('música') || serviceLower.includes('dj')) {
        additionalServices.push({
          description: 'DJ y equipo de sonido',
          amount: 800,
          category: 'entertainment'
        });
      } else if (serviceLower.includes('fotografía')) {
        additionalServices.push({
          description: 'Servicio de fotografía',
          amount: 1200,
          category: 'photography'
        });
      } else if (serviceLower.includes('decoración')) {
        additionalServices.push({
          description: 'Decoración premium',
          amount: 1500,
          category: 'decoration'
        });
      }
    }

    return additionalServices;
  }
}

// Instancia singleton del servicio
export const eventAgentService = new EventAgentService();