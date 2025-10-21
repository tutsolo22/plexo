import { crmAgentService, type AgentResponse } from './crm-agent';
import {
  whatsappAgentService,
  type WhatsAppMessage,
  type WhatsAppResponse,
} from './whatsapp-agent';

// ===============================
// TIPOS PARA COORDINACIÓN
// ===============================

export interface AgentCoordinatorResponse {
  response: WhatsAppResponse | AgentResponse;
  source: 'whatsapp' | 'crm';
  escalated: boolean;
  metadata: {
    processingTime: number;
    confidence: number;
    nextRecommendedAction?: string;
  };
}

export interface CoordinationContext {
  conversationId: string;
  tenantId: string;
  userPhone: string;
  escalationHistory: EscalationEvent[];
  currentAgent: 'whatsapp' | 'crm';
  sessionStartTime: Date;
}

export interface EscalationEvent {
  timestamp: Date;
  from: 'whatsapp' | 'crm';
  to: 'whatsapp' | 'crm';
  reason: string;
  confidence: number;
  message: string;
}

// ===============================
// COORDINADOR PRINCIPAL
// ===============================

export class AgentCoordinatorService {
  private activeCoordinations: Map<string, CoordinationContext> = new Map();
  private escalationThreshold = 70; // Umbral de confianza para escalamiento
  private maxRetries = 3;

  /**
   * Procesa un mensaje coordinando entre WhatsAppAgent y CRMAgent
   */
  async processMessage(
    message: WhatsAppMessage,
    tenantId: string
  ): Promise<AgentCoordinatorResponse> {
    const startTime = Date.now();

    try {
      // 1. Obtener o crear contexto de coordinación
      const coordinationKey = `${message.from}_${tenantId}`;
      const coordination = this.getOrCreateCoordination(coordinationKey, message.from, tenantId);

      // 2. Decidir qué agente debe manejar el mensaje
      const agentDecision = await this.decideAgent(message, coordination);

      let response: WhatsAppResponse | AgentResponse;
      let source: 'whatsapp' | 'crm';
      let escalated = false;

      // 3. Procesar con el agente seleccionado
      if (agentDecision.useAgent === 'whatsapp') {
        response = await whatsappAgentService.processIncomingMessage(message, tenantId);
        source = 'whatsapp';

        // Verificar si WhatsApp agente decidió escalar
        if ('shouldEscalate' in response && response.shouldEscalate) {
          escalated = true;
          await this.recordEscalation(
            coordination,
            'whatsapp',
            'crm',
            ('escalationReason' in response ? response.escalationReason : null) ||
              'Escalamiento automático',
            agentDecision.confidence
          );
          coordination.currentAgent = 'crm';
        }
      } else {
        // Usar CRMAgent directamente
        response = await crmAgentService.processMessage(
          message.body,
          tenantId,
          'USER',
          coordination.conversationId
        );
        source = 'crm';
        escalated = true;
        coordination.currentAgent = 'crm';
      }

      // 4. Actualizar contexto de coordinación
      this.updateCoordination(coordinationKey, coordination);

      return {
        response,
        source,
        escalated,
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: agentDecision.confidence,
          nextRecommendedAction: this.getNextRecommendedAction(response, source),
        },
      };
    } catch (error) {
      console.error('Error en coordinación de agentes:', error);

      // Respuesta de fallback
      return {
        response: {
          message:
            'Disculpa, estoy experimentando dificultades técnicas. ¿Podrías intentar de nuevo en un momento?',
          messageType: 'text',
          shouldEscalate: false,
          conversationId: '',
        },
        source: 'whatsapp',
        escalated: false,
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0,
          nextRecommendedAction: 'retry',
        },
      };
    }
  }

  /**
   * Decide qué agente debe manejar el mensaje
   */
  private async decideAgent(
    message: WhatsAppMessage,
    coordination: CoordinationContext
  ): Promise<{ useAgent: 'whatsapp' | 'crm'; confidence: number; reason: string }> {
    // Si ya estamos en modo CRM, continuar con CRM a menos que sea un saludo simple
    if (coordination.currentAgent === 'crm') {
      const isSimpleGreeting = this.isSimpleGreeting(message.body);
      if (!isSimpleGreeting) {
        return {
          useAgent: 'crm',
          confidence: 90,
          reason: 'Conversación ya escalada al CRM',
        };
      }
    }

    // Análisis básico del mensaje para decidir
    const messageAnalysis = await this.analyzeMessageComplexity(message.body);

    // Reglas de decisión
    if (messageAnalysis.complexity === 'low' && messageAnalysis.confidence > 80) {
      return {
        useAgent: 'whatsapp',
        confidence: messageAnalysis.confidence,
        reason: 'Mensaje simple, puede ser manejado por WhatsApp Agent',
      };
    }

    if (messageAnalysis.hasSpecificRequest || messageAnalysis.complexity === 'high') {
      return {
        useAgent: 'crm',
        confidence: 85,
        reason: 'Solicitud específica o compleja, requiere CRM Agent',
      };
    }

    // Por defecto, empezar con WhatsApp
    return {
      useAgent: 'whatsapp',
      confidence: 60,
      reason: 'Evaluación inicial con WhatsApp Agent',
    };
  }

  /**
   * Analiza la complejidad del mensaje
   */
  private async analyzeMessageComplexity(message: string): Promise<{
    complexity: 'low' | 'medium' | 'high';
    confidence: number;
    hasSpecificRequest: boolean;
    keywords: string[];
  }> {
    const text = message.toLowerCase();

    // Palabras clave que indican complejidad alta
    const highComplexityKeywords = [
      'cotización',
      'cotizacion',
      'presupuesto',
      'precio',
      'costo',
      'disponibilidad',
      'reservar',
      'evento',
      'celebración',
      'celebracion',
      'boda',
      'quinceañera',
      'quinceañera',
      'cumpleaños',
      'cumpleanos',
      'corporativo',
      'empresa',
      'reunión',
      'reunion',
      'conferencia',
    ];

    // Palabras clave que indican solicitudes específicas
    const specificRequestKeywords = [
      'cuánto',
      'cuanto',
      'cuando',
      'donde',
      'dónde',
      'qué incluye',
      'que incluye',
      'modificar',
      'cambiar',
      'cancelar',
      'confirmar',
      'agendar',
    ];

    // Saludos simples
    const simpleGreetings = [
      'hola',
      'hello',
      'hi',
      'buenas',
      'buen día',
      'buen dia',
      'buenos días',
      'buenos dias',
      'buenas tardes',
      'buenas noches',
    ];

    const foundHighComplexity = highComplexityKeywords.some(keyword => text.includes(keyword));
    const foundSpecificRequest = specificRequestKeywords.some(keyword => text.includes(keyword));
    const isSimpleGreeting = simpleGreetings.some(greeting => text.includes(greeting));

    let complexity: 'low' | 'medium' | 'high' = 'medium';
    let confidence = 50;

    if (isSimpleGreeting && message.length < 20) {
      complexity = 'low';
      confidence = 90;
    } else if (foundHighComplexity || foundSpecificRequest) {
      complexity = 'high';
      confidence = 85;
    } else if (message.length > 100 || message.split(' ').length > 20) {
      complexity = 'high';
      confidence = 75;
    } else {
      complexity = 'low';
      confidence = 70;
    }

    return {
      complexity,
      confidence,
      hasSpecificRequest: foundSpecificRequest,
      keywords: [...highComplexityKeywords, ...specificRequestKeywords].filter(keyword =>
        text.includes(keyword)
      ),
    };
  }

  /**
   * Verifica si es un saludo simple
   */
  private isSimpleGreeting(message: string): boolean {
    const text = message.toLowerCase().trim();
    const simpleGreetings = [
      'hola',
      'hello',
      'hi',
      'buenas',
      'buen día',
      'buen dia',
      'buenos días',
      'buenos dias',
      'buenas tardes',
      'buenas noches',
      'hey',
      'saludos',
    ];

    return (
      simpleGreetings.some(
        greeting =>
          text === greeting || text.startsWith(greeting + ' ') || text.startsWith(greeting + '!')
      ) && text.length < 30
    );
  }

  /**
   * Obtiene o crea un contexto de coordinación
   */
  private getOrCreateCoordination(
    key: string,
    userPhone: string,
    tenantId: string
  ): CoordinationContext {
    let coordination = this.activeCoordinations.get(key);

    if (!coordination) {
      coordination = {
        conversationId: `coord_${key}_${Date.now()}`,
        tenantId,
        userPhone,
        escalationHistory: [],
        currentAgent: 'whatsapp',
        sessionStartTime: new Date(),
      };
      this.activeCoordinations.set(key, coordination);
    }

    return coordination;
  }

  /**
   * Actualiza el contexto de coordinación
   */
  private updateCoordination(key: string, coordination: CoordinationContext): void {
    this.activeCoordinations.set(key, {
      ...coordination,
      sessionStartTime: coordination.sessionStartTime, // Mantener tiempo original
    });
  }

  /**
   * Registra un evento de escalamiento
   */
  private async recordEscalation(
    coordination: CoordinationContext,
    from: 'whatsapp' | 'crm',
    to: 'whatsapp' | 'crm',
    reason: string,
    confidence: number
  ): Promise<void> {
    const escalationEvent: EscalationEvent = {
      timestamp: new Date(),
      from,
      to,
      reason,
      confidence,
      message: `Escalado de ${from} a ${to}: ${reason}`,
    };

    coordination.escalationHistory.push(escalationEvent);

    // Mantener solo los últimos 10 escalamientos
    if (coordination.escalationHistory.length > 10) {
      coordination.escalationHistory = coordination.escalationHistory.slice(-10);
    }
  }

  /**
   * Determina la próxima acción recomendada
   */
  private getNextRecommendedAction(
    response: WhatsAppResponse | AgentResponse,
    source: 'whatsapp' | 'crm'
  ): string {
    if ('shouldEscalate' in response && response.shouldEscalate) {
      return 'escalate_to_crm';
    }

    if ('nextExpectedInput' in response && response.nextExpectedInput) {
      return `expect_${response.nextExpectedInput}`;
    }

    if (source === 'whatsapp') {
      return 'continue_whatsapp';
    } else {
      return 'continue_crm';
    }
  }

  /**
   * Obtiene estadísticas de coordinación
   */
  getCoordinationStats(): {
    activeCoordinations: number;
    totalEscalations: number;
    averageSessionDuration: number;
    agentUsageStats: { whatsapp: number; crm: number };
  } {
    const coordinations = Array.from(this.activeCoordinations.values());
    const now = new Date();

    const totalEscalations = coordinations.reduce(
      (sum, coord) => sum + coord.escalationHistory.length,
      0
    );

    const averageSessionDuration =
      coordinations.length > 0
        ? coordinations.reduce(
            (sum, coord) => sum + (now.getTime() - coord.sessionStartTime.getTime()),
            0
          ) / coordinations.length
        : 0;

    const agentUsage = coordinations.reduce(
      (stats, coord) => {
        stats[coord.currentAgent]++;
        return stats;
      },
      { whatsapp: 0, crm: 0 }
    );

    return {
      activeCoordinations: coordinations.length,
      totalEscalations,
      averageSessionDuration: Math.round(averageSessionDuration / 1000 / 60), // en minutos
      agentUsageStats: agentUsage,
    };
  }

  /**
   * Limpia coordinaciones inactivas (más de 30 minutos sin actividad)
   */
  cleanupInactiveCoordinations(): void {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const keysToDelete: string[] = [];
    this.activeCoordinations.forEach((coordination, key) => {
      if (coordination.sessionStartTime < thirtyMinutesAgo) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.activeCoordinations.delete(key);
    });
  }

  /**
   * Fuerza el cambio de agente para una coordinación específica
   */
  async forceAgentSwitch(
    userPhone: string,
    tenantId: string,
    newAgent: 'whatsapp' | 'crm',
    reason = 'Manual override'
  ): Promise<boolean> {
    const key = `${userPhone}_${tenantId}`;
    const coordination = this.activeCoordinations.get(key);

    if (!coordination) {
      return false;
    }

    const oldAgent = coordination.currentAgent;
    coordination.currentAgent = newAgent;

    await this.recordEscalation(coordination, oldAgent, newAgent, reason, 100);
    this.updateCoordination(key, coordination);

    return true;
  }
}

// Instancia singleton del coordinador
export const agentCoordinator = new AgentCoordinatorService();

// Configurar limpieza automática cada 15 minutos
if (typeof globalThis !== 'undefined') {
  const globalObj = globalThis as any;
  if (!globalObj.coordinatorCleanupInterval) {
    globalObj.coordinatorCleanupInterval = setInterval(
      () => {
        agentCoordinator.cleanupInactiveCoordinations();
      },
      15 * 60 * 1000
    );
  }
}

export default agentCoordinator;
