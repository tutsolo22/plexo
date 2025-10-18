// Sistema de Agentes de IA - Exportaciones principales
export { 
  CRMAgentService, 
  crmAgentService, 
  CRMAgent 
} from './crm-agent';

export {
  WhatsAppAgentService,
  whatsappAgentService,
  WhatsAppAgent
} from './whatsapp-agent';

export {
  AgentCoordinatorService,
  agentCoordinator
} from './agent-coordinator';

export {
  CRMEmbeddingService,
  crmEmbeddingService
} from './crm-embeddings';

export {
  ConversationMemoryService
} from './conversation-memory';

// Importar las instancias para uso interno
import { crmAgentService } from './crm-agent';
import { whatsappAgentService } from './whatsapp-agent';
import { agentCoordinator } from './agent-coordinator';
import { crmEmbeddingService } from './crm-embeddings';

// Tipos principales
export type {
  // CRM Agent Types
  AgentMessage,
  AgentResponse,
  CRMSearchParams,
  SearchEventsParams,
  SearchQuotesParams,
  SearchClientsParams,
  SearchProductsParams,
  SearchRoomsParams
} from './crm-agent';

export type {
  // WhatsApp Agent Types
  WhatsAppMessage,
  WhatsAppConversation,
  ConversationContext,
  ConversationState,
  IntentAnalysis,
  ExtractedEntity,
  WhatsAppResponse,
  WhatsAppAction
} from './whatsapp-agent';

export type {
  // Coordinator Types
  AgentCoordinatorResponse,
  CoordinationContext,
  EscalationEvent
} from './agent-coordinator';

export type {
  // Tipos compartidos
  CRMSearchResult,
  EventAnalysis,
  ClientAnalysis,
  QuoteGeneration,
  GeneratedQuote,
  QuoteItem,
  UpgradeSuggestion,
  CRMAgentOptions,
  SearchOptions,
  CRMResponse,
  EventSuggestion,
  WhatsAppIntentClassification,
  WhatsAppEntity,
  WhatsAppConversationState,
  WhatsAppEscalationDecision
} from './types';

// Configuración por defecto
export const AI_CONFIG = {
  models: {
    crm: 'gemini-1.5-flash',
    whatsapp: 'gemini-1.5-flash',
    embeddings: 'text-embedding-004'
  },
  settings: {
    temperature: 0.7,
    maxTokens: 2048,
    similarityThreshold: 0.7,
    conversationTimeout: 30 * 60 * 1000, // 30 minutos
    escalationThreshold: 70
  }
};

// Funciones de utilidad
export const AgentUtils = {
  /**
   * Formatea un mensaje para el agente de WhatsApp
   */
  formatWhatsAppMessage: (
    from: string,
    body: string,
    type: 'text' | 'image' | 'document' = 'text'
  ) => ({
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    from,
    to: 'assistant',
    body,
    timestamp: new Date(),
    type
  }),

  /**
   * Extrae información de contacto de un mensaje
   */
  extractContactInfo: (message: string) => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+?[0-9]{1,3}[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3,4}[-.\s]?[0-9]{4}/g;
    
    const emails = message.match(emailRegex) || [];
    const phones = message.match(phoneRegex) || [];
    
    return {
      emails,
      phones,
      hasContact: emails.length > 0 || phones.length > 0
    };
  },

  /**
   * Detecta el idioma del mensaje
   */
  detectLanguage: (message: string): 'es' | 'en' => {
    const spanishWords = [
      'hola', 'gracias', 'por favor', 'sí', 'no', 'que', 'como', 'cuando', 
      'donde', 'porque', 'pero', 'con', 'para', 'desde', 'hasta'
    ];
    
    const englishWords = [
      'hello', 'thank', 'please', 'yes', 'what', 'how', 'when', 
      'where', 'because', 'but', 'with', 'for', 'from', 'until'
    ];
    
    const lowerMessage = message.toLowerCase();
    const spanishCount = spanishWords.filter(word => lowerMessage.includes(word)).length;
    const englishCount = englishWords.filter(word => lowerMessage.includes(word)).length;
    
    return spanishCount >= englishCount ? 'es' : 'en';
  },

  /**
   * Valida el formato de un número de teléfono
   */
  validatePhoneNumber: (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  },

  /**
   * Genera un ID único para conversaciones
   */
  generateConversationId: (phone: string, tenantId: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `conv_${phone}_${tenantId}_${timestamp}_${random}`;
  }
};

// Instancia principal para uso directo
export const AIAgents = {
  crm: crmAgentService,
  whatsapp: whatsappAgentService,
  coordinator: agentCoordinator,
  embeddings: crmEmbeddingService
};