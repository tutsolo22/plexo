import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { crmAgentService } from './crm-agent';
import { RESPONSE_TEMPLATES } from './prompt-templates';

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env['GOOGLE_AI_API_KEY'] || '');

// ===============================
// TIPOS E INTERFACES
// ===============================

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppConversation {
  id: string;
  phone: string;
  tenantId: string;
  status: 'active' | 'paused' | 'closed';
  context: ConversationContext;
  lastActivity: Date;
}

export interface ConversationContext {
  currentIntent?: string;
  userData?:
    | {
        name?: string;
        email?: string | undefined;
        clientId?: string;
        isExistingClient?: boolean;
      }
    | undefined;
  conversationState: ConversationState;
  sessionData: Record<string, any>;
  escalationLevel: 'low' | 'medium' | 'high';
}

export interface ConversationState {
  phase: 'greeting' | 'gathering_info' | 'processing_request' | 'escalated' | 'completed';
  step?: string;
  expectedInput?: string;
  retryCount: number;
  lastIntentConfidence: number;
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities: ExtractedEntity[];
  requiredInfo: string[];
  suggestedResponse: string;
  needsEscalation: boolean;
  escalationReason?: string;
}

export interface ExtractedEntity {
  type: 'name' | 'email' | 'phone' | 'date' | 'event_type' | 'guest_count' | 'budget' | 'location';
  value: string;
  confidence: number;
}

export interface WhatsAppResponse {
  message: string;
  messageType: 'text' | 'interactive' | 'template';
  actions?: WhatsAppAction[];
  shouldEscalate: boolean;
  escalationReason?: string;
  conversationId: string;
  nextExpectedInput?: string;
}

export interface WhatsAppAction {
  type: 'button' | 'list' | 'quick_reply';
  title: string;
  payload: string;
  description?: string;
}

// ===============================
// CLASE PRINCIPAL
// ===============================

export class WhatsAppAgentService {
  private model: any;
  private conversationTimeout = 30 * 60 * 1000; // 30 minutos

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });
  }

  /**
   * Procesa un mensaje entrante de WhatsApp
   */
  async processIncomingMessage(
    message: WhatsAppMessage,
    tenantId: string
  ): Promise<WhatsAppResponse> {
    try {
      // 1. Obtener o crear conversación
      const conversation = await this.getOrCreateConversation(message.from, tenantId);

      // 2. Guardar mensaje entrante
      await this.saveMessage(conversation.id, 'user', message.body, {
        messageId: message.id,
        messageType: message.type,
        mediaUrl: message.mediaUrl,
      });

      // 3. Analizar intención del mensaje
      const intentAnalysis = await this.analyzeIntent(message.body, conversation.context);

      // 4. Actualizar contexto de conversación
      conversation.context = await this.updateConversationContext(
        conversation.context,
        intentAnalysis,
        message.body
      );

      // 5. Decidir si escalar al CRMAgent
      if (this.shouldEscalateToAgent(intentAnalysis, conversation.context)) {
        return await this.escalateToAgent(message.body, conversation, tenantId, intentAnalysis);
      }

      // 6. Generar respuesta contextual
      const response = await this.generateContextualResponse(
        message.body,
        conversation.context,
        intentAnalysis
      );

      // 7. Guardar respuesta y actualizar conversación
      await this.saveMessage(conversation.id, 'assistant', response.message);
      await this.updateConversationState(conversation.id, conversation.context);

      return {
        ...response,
        conversationId: conversation.id,
      };
    } catch (error) {
      console.error('Error procesando mensaje de WhatsApp:', error);
      return {
        message: RESPONSE_TEMPLATES.ERROR,
        messageType: 'text',
        shouldEscalate: false,
        conversationId: '',
      };
    }
  }

  /**
   * Analiza la intención del mensaje usando IA
   */
  private async analyzeIntent(
    message: string,
    context: ConversationContext
  ): Promise<IntentAnalysis> {
    const intentPrompt = `
Analiza este mensaje de WhatsApp y extrae la intención, entidades y información relevante:

MENSAJE: "${message}"

CONTEXTO DE CONVERSACIÓN:
- Fase actual: ${context.conversationState.phase}
- Intención previa: ${context.currentIntent || 'ninguna'}
- Datos del usuario: ${JSON.stringify(context.userData || {})}

INSTRUCCIONES:
1. Identifica la intención principal (consulta_evento, solicitar_cotizacion, modificar_evento, cancelar_evento, consulta_general, saludo, despedida, etc.)
2. Extrae entidades como nombres, fechas, tipos de evento, número de invitados, presupuesto
3. Determina si necesita información adicional
4. Evalúa si requiere escalamiento al agente de CRM

INTENCIONES PRINCIPALES:
- saludo: Saludos iniciales o presentación
- consulta_evento: Preguntas sobre organización de eventos
- solicitar_cotizacion: Solicitud de presupuesto para evento
- modificar_evento: Cambios en evento existente
- cancelar_evento: Cancelación de evento
- consulta_disponibilidad: Verificar fechas disponibles
- consulta_servicios: Preguntar sobre servicios/productos
- consulta_general: Preguntas generales sobre la empresa
- seguimiento: Seguimiento de cotizaciones o eventos

RESPONDE EN FORMATO JSON:
{
  "intent": "intención_principal",
  "confidence": number (0-100),
  "entities": [
    {
      "type": "tipo_entidad",
      "value": "valor_extraído",
      "confidence": number (0-100)
    }
  ],
  "requiredInfo": ["información que falta por obtener"],
  "suggestedResponse": "respuesta sugerida para esta intención",
  "needsEscalation": boolean,
  "escalationReason": "razón si necesita escalamiento"
}
`;

    try {
      const result = await this.model.generateContent(intentPrompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          intent: analysis.intent || 'consulta_general',
          confidence: analysis.confidence || 50,
          entities: analysis.entities || [],
          requiredInfo: analysis.requiredInfo || [],
          suggestedResponse: analysis.suggestedResponse || '',
          needsEscalation: analysis.needsEscalation || false,
          escalationReason: analysis.escalationReason,
        };
      }
    } catch (error) {
      console.error('Error analizando intención:', error);
    }

    // Fallback básico
    return {
      intent: 'consulta_general',
      confidence: 30,
      entities: [],
      requiredInfo: [],
      suggestedResponse:
        'Entiendo que tienes una consulta. ¿Podrías ser más específico sobre lo que necesitas?',
      needsEscalation: false,
    };
  }

  /**
   * Obtiene o crea una conversación para el número de teléfono
   */
  private async getOrCreateConversation(
    phone: string,
    tenantId: string
  ): Promise<WhatsAppConversation> {
    try {
      // Buscar conversación activa existente
      const existingConversation = await prisma.botMessage.findFirst({
        where: {
          phone,
          tenantId,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingConversation) {
        // Verificar si la conversación está dentro del timeout
        const timeDiff = Date.now() - existingConversation.createdAt.getTime();
        if (timeDiff < this.conversationTimeout) {
          return {
            id: `conversation_${phone}_${tenantId}`,
            phone,
            tenantId,
            status: 'active',
            context: await this.loadConversationContext(phone, tenantId),
            lastActivity: existingConversation.createdAt,
          };
        }
      }

      // Crear nueva conversación
      const newConversation: WhatsAppConversation = {
        id: `conversation_${phone}_${tenantId}`,
        phone,
        tenantId,
        status: 'active',
        context: {
          conversationState: {
            phase: 'greeting',
            retryCount: 0,
            lastIntentConfidence: 0,
          },
          sessionData: {},
          escalationLevel: 'low',
        },
        lastActivity: new Date(),
      };

      await this.saveConversationContext(newConversation);
      return newConversation;
    } catch (error) {
      console.error('Error obteniendo/creando conversación:', error);
      throw new Error('Failed to get or create conversation');
    }
  }

  /**
   * Carga el contexto de conversación desde la base de datos
   */
  private async loadConversationContext(
    phone: string,
    tenantId: string
  ): Promise<ConversationContext> {
    try {
      // Obtener los últimos mensajes para reconstruir contexto
      const recentMessages = await prisma.botMessage.findMany({
        where: {
          phone,
          tenantId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Buscar cliente existente por teléfono
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId,
          phone: { contains: phone.replace(/\D/g, '') }, // Solo números
        },
      });

      return {
        conversationState: {
          phase: recentMessages.length > 0 ? 'processing_request' : 'greeting',
          retryCount: 0,
          lastIntentConfidence: 70,
        },
        userData: existingClient
          ? {
              name: existingClient.name,
              email: existingClient.email || undefined,
              clientId: existingClient.id,
              isExistingClient: true,
            }
          : undefined,
        sessionData: {},
        escalationLevel: 'low',
      };
    } catch (error) {
      console.error('Error cargando contexto:', error);
      return {
        conversationState: {
          phase: 'greeting',
          retryCount: 0,
          lastIntentConfidence: 0,
        },
        sessionData: {},
        escalationLevel: 'low',
      };
    }
  }

  /**
   * Actualiza el contexto de conversación basado en el análisis de intención
   */
  private async updateConversationContext(
    context: ConversationContext,
    intentAnalysis: IntentAnalysis,
    _userMessage: string
  ): Promise<ConversationContext> {
    // Actualizar intención actual
    context.currentIntent = intentAnalysis.intent;
    context.conversationState.lastIntentConfidence = intentAnalysis.confidence;

    // Extraer y actualizar datos del usuario de las entidades
    intentAnalysis.entities.forEach(entity => {
      if (!context.userData) context.userData = {};

      switch (entity.type) {
        case 'name':
          context.userData.name = entity.value;
          break;
        case 'email':
          context.userData.email = entity.value;
          break;
        case 'event_type':
          context.sessionData['eventType'] = entity.value;
          break;
        case 'guest_count':
          context.sessionData['guestCount'] = parseInt(entity.value);
          break;
        case 'budget':
          context.sessionData['budget'] = parseFloat(entity.value.replace(/[^\d.]/g, ''));
          break;
        case 'date':
          context.sessionData['preferredDate'] = entity.value;
          break;
      }
    });

    // Actualizar fase de conversación
    context.conversationState = this.calculateNextPhase(context.conversationState, intentAnalysis);

    // Actualizar nivel de escalación
    if (intentAnalysis.needsEscalation || intentAnalysis.confidence < 40) {
      context.escalationLevel = intentAnalysis.confidence < 20 ? 'high' : 'medium';
    }

    return context;
  }

  /**
   * Calcula la siguiente fase de la conversación
   */
  private calculateNextPhase(
    currentState: ConversationState,
    intentAnalysis: IntentAnalysis
  ): ConversationState {
    const newState = { ...currentState };

    switch (intentAnalysis.intent) {
      case 'saludo':
        newState.phase = 'greeting';
        break;

      case 'solicitar_cotizacion':
        newState.phase = 'gathering_info';
        newState.expectedInput = 'event_details';
        break;

      case 'consulta_evento':
      case 'consulta_servicios':
      case 'consulta_disponibilidad':
        newState.phase = 'processing_request';
        break;

      default:
        if (intentAnalysis.needsEscalation) {
          newState.phase = 'escalated';
        } else if (intentAnalysis.requiredInfo.length > 0) {
          newState.phase = 'gathering_info';
        } else {
          newState.phase = 'processing_request';
        }
    }

    return newState;
  }

  /**
   * Determina si debe escalar al CRMAgent
   */
  private shouldEscalateToAgent(
    intentAnalysis: IntentAnalysis,
    context: ConversationContext
  ): boolean {
    // Escalamiento por baja confianza
    if (intentAnalysis.confidence < 30) {
      return true;
    }

    // Escalamiento por intenciones complejas
    const complexIntents = [
      'solicitar_cotizacion',
      'modificar_evento',
      'cancelar_evento',
      'consulta_disponibilidad',
    ];

    if (complexIntents.includes(intentAnalysis.intent)) {
      return true;
    }

    // Escalamiento por información suficiente para CRM
    if (context.userData?.name && context.sessionData['eventType']) {
      return true;
    }

    // Escalamiento por nivel alto
    if (context.escalationLevel === 'high') {
      return true;
    }

    return false;
  }

  /**
   * Escala la conversación al CRMAgent
   */
  private async escalateToAgent(
    message: string,
    conversation: WhatsAppConversation,
    tenantId: string,
    intentAnalysis: IntentAnalysis
  ): Promise<WhatsAppResponse> {
    try {
      // Preparar contexto para el CRMAgent
      const crmContext = this.prepareCRMContext(conversation.context, message);

      // Llamar al CRMAgent
      const crmResponse = await crmAgentService.processMessage(
        message,
        tenantId,
        'USER',
        conversation.id,
        crmContext
      );

      // Actualizar estado de conversación
      conversation.context.conversationState.phase = 'escalated';
      await this.updateConversationState(conversation.id, conversation.context);

      return {
        message: crmResponse.message,
        messageType: 'text',
        shouldEscalate: true,
        escalationReason:
          intentAnalysis.escalationReason || 'Consulta compleja que requiere agente especializado',
        conversationId: conversation.id,
      };
    } catch (error) {
      console.error('Error escalando a CRMAgent:', error);
      return {
        message:
          'Entiendo que necesitas ayuda especializada. Un momento mientras conecto con nuestro sistema de gestión...',
        messageType: 'text',
        shouldEscalate: true,
        escalationReason: 'Error en escalamiento',
        conversationId: conversation.id,
      };
    }
  }

  /**
   * Prepara el contexto para el CRMAgent
   */
  private prepareCRMContext(whatsappContext: ConversationContext, _currentMessage: string): any[] {
    const context = [];

    // Agregar información del usuario si está disponible
    if (whatsappContext.userData?.name) {
      context.push({
        role: 'user',
        parts: [{ text: `Mi nombre es ${whatsappContext.userData.name}` }],
      });
    }

    // Agregar información de sesión relevante
    if (whatsappContext.sessionData['eventType']) {
      context.push({
        role: 'user',
        parts: [
          {
            text: `Estoy interesado en un evento de tipo: ${whatsappContext.sessionData['eventType']}`,
          },
        ],
      });
    }

    if (whatsappContext.sessionData['guestCount']) {
      context.push({
        role: 'user',
        parts: [
          { text: `Para aproximadamente ${whatsappContext.sessionData['guestCount']} personas` },
        ],
      });
    }

    if (whatsappContext.sessionData['budget']) {
      context.push({
        role: 'user',
        parts: [
          { text: `Mi presupuesto aproximado es de $${whatsappContext.sessionData['budget']}` },
        ],
      });
    }

    return context;
  }

  /**
   * Genera una respuesta contextual para mensajes que no requieren escalamiento
   */
  private async generateContextualResponse(
    message: string,
    context: ConversationContext,
    intentAnalysis: IntentAnalysis
  ): Promise<WhatsAppResponse> {
    const responsePrompt = `
Genera una respuesta natural y útil para este mensaje de WhatsApp:

MENSAJE: "${message}"
INTENCIÓN: ${intentAnalysis.intent}
CONFIANZA: ${intentAnalysis.confidence}%
FASE: ${context.conversationState.phase}

CONTEXTO DEL USUARIO:
${JSON.stringify(context.userData || {})}

DATOS DE SESIÓN:
${JSON.stringify(context.sessionData || {})}

INSTRUCCIONES:
1. Responde de manera amigable y profesional
2. Si necesitas más información, haz preguntas específicas
3. Mantén el tono conversacional de WhatsApp
4. Sé conciso pero informativo
5. Si es un saludo, preséntate como asistente de Plexo
6. Para consultas sobre eventos, ofrece ayuda específica

RESPONDE EN FORMATO JSON:
{
  "message": "respuesta al usuario",
  "messageType": "text",
  "actions": [
    {
      "type": "quick_reply",
      "title": "opción rápida",
      "payload": "payload_data"
    }
  ],
  "nextExpectedInput": "tipo de entrada esperada siguiente"
}
`;

    try {
      const result = await this.model.generateContent(responsePrompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResponse = JSON.parse(jsonMatch[0]);
        return {
          message: aiResponse.message || intentAnalysis.suggestedResponse,
          messageType: aiResponse.messageType || 'text',
          actions: aiResponse.actions || [],
          shouldEscalate: false,
          conversationId: '',
          nextExpectedInput: aiResponse.nextExpectedInput,
        };
      }
    } catch (error) {
      console.error('Error generando respuesta contextual:', error);
    }

    // Respuesta de fallback
    return {
      message:
        intentAnalysis.suggestedResponse || 'Gracias por tu mensaje. ¿En qué puedo ayudarte hoy?',
      messageType: 'text',
      shouldEscalate: false,
      conversationId: '',
    };
  }

  /**
   * Guarda un mensaje en la base de datos
   */
  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    _metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Extraer información del conversationId
      const parts = conversationId.split('_');
      const phone = parts[1];
      const tenantId = parts[2];

      if (!phone || !tenantId) {
        console.error('Invalid conversationId format:', conversationId);
        return;
      }

      await prisma.botMessage.create({
        data: {
          tenantId,
          phone,
          direction: role === 'user' ? 'in' : 'out',
          text: content,
        },
      });
    } catch (error) {
      console.error('Error guardando mensaje:', error);
    }
  }

  /**
   * Actualiza el estado de la conversación
   */
  private async updateConversationState(
    conversationId: string,
    context: ConversationContext
  ): Promise<void> {
    try {
      // Por ahora, solo actualizamos el timestamp en BotMessage
      // En una implementación más completa, se podría usar el sistema de conversaciones
      const parts = conversationId.split('_');
      const phone = parts[1];
      const tenantId = parts[2];

      if (!phone || !tenantId) {
        console.error('Invalid conversationId format:', conversationId);
        return;
      }

      // Actualizar o crear registro de estado (simulado con BotMessage)
      await prisma.botMessage.create({
        data: {
          tenantId,
          phone,
          direction: 'out',
          text: `[SYSTEM] Context updated: ${JSON.stringify(context.conversationState)}`,
        },
      });
    } catch (error) {
      console.error('Error actualizando estado de conversación:', error);
    }
  }

  /**
   * Guarda el contexto completo de la conversación
   */
  private async saveConversationContext(conversation: WhatsAppConversation): Promise<void> {
    try {
      // Implementación simplificada usando BotMessage
      await prisma.botMessage.create({
        data: {
          tenantId: conversation.tenantId,
          phone: conversation.phone,
          direction: 'out',
          text: `[SYSTEM] Conversation started: ${JSON.stringify(conversation.context)}`,
        },
      });
    } catch (error) {
      console.error('Error guardando contexto de conversación:', error);
    }
  }

  /**
   * Obtiene el historial de mensajes de una conversación
   */
  async getConversationHistory(
    phone: string,
    tenantId: string,
    limit = 50
  ): Promise<WhatsAppMessage[]> {
    try {
      const messages = await prisma.botMessage.findMany({
        where: {
          phone,
          tenantId,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return messages.reverse().map(msg => ({
        id: msg.id,
        from: msg.direction === 'in' ? phone : 'assistant',
        to: msg.direction === 'in' ? 'assistant' : phone,
        body: msg.text || '',
        timestamp: msg.createdAt,
        type: 'text',
      }));
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Procesa un mensaje desde el widget del sitio web
   */
  async processWidgetMessage(context: {
    phone: string;
    tenantId: string;
    message: string;
    conversationId: string;
  }): Promise<{ message: string; shouldEscalate: boolean }> {
    try {
      // Crear mensaje simulado de WhatsApp
      const widgetMessage: WhatsAppMessage = {
        id: `widget_${Date.now()}`,
        from: context.phone,
        to: 'widget_assistant',
        body: context.message,
        timestamp: new Date(),
        type: 'text',
      };

      // Procesar como mensaje normal de WhatsApp
      const response = await this.processIncomingMessage(widgetMessage, context.tenantId);

      return {
        message: response.message,
        shouldEscalate: response.shouldEscalate,
      };

    } catch (error) {
      console.error('Error procesando mensaje del widget:', error);
      return {
        message: 'Lo siento, hubo un error procesando tu mensaje. Por favor, intenta de nuevo.',
        shouldEscalate: false,
      };
    }
  }
}

// Instancia singleton del servicio
export const whatsappAgentService = new WhatsAppAgentService();

// Exportaciones por defecto
export { WhatsAppAgentService as WhatsAppAgent };
export default whatsappAgentService;
