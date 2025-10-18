// Tipos compartidos para el sistema de IA
import { Client, Event, Quote, Product, EventStatus, QuoteStatus, ClientType } from '@prisma/client';

// ===============================
// TIPOS PRINCIPALES
// ===============================

export interface CRMSearchResult {
  id: string;
  similarity: number;
  content: string;
  metadata: Record<string, any>;
  type: 'event' | 'client' | 'quote' | 'product';
  entity: any; // Datos completos de la entidad
}

export interface EventAnalysis {
  id: string;
  title: string;
  similarity: number;
  suggestedPrice: number;
  reasons: string[];
  riskFactors: string[];
}

export interface ClientAnalysis {
  clientId: string;
  profile: {
    type: ClientType;
    totalEvents: number;
    averageSpending: number;
    loyaltyScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  patterns: {
    preferredMonths: string[];
    commonServices: string[];
    averageGuestCount: number;
    priceRange: { min: number; max: number };
  };
  recommendations: {
    type: 'UPSELL' | 'RETENTION' | 'PRICING';
    description: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
}

export interface QuoteGeneration {
  event: {
    title: string;
    startDate: Date;
    endDate: Date;
    guestCount: number;
    venueId?: string;
    roomId?: string;
    specialRequirements?: string[];
  };
  client: {
    id: string;
    type: ClientType;
    discountPercent?: number;
  };
  preferences: {
    packageType?: 'BASICO' | 'VIP' | 'GOLD' | 'DIAMANTE';
    budget?: number;
    includeUpgrades?: boolean;
  };
}

export interface GeneratedQuote {
  subtotal: number;
  discount: number;
  total: number;
  packages: {
    name: string;
    description: string;
    items: QuoteItem[];
    subtotal: number;
  }[];
  suggestions: UpgradeSuggestion[];
  reasoning: string;
}

export interface QuoteItem {
  type: 'product' | 'service';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface UpgradeSuggestion {
  type: 'PACKAGE_UPGRADE' | 'ADDITIONAL_SERVICE' | 'PREMIUM_PRODUCT';
  title: string;
  description: string;
  additionalCost: number;
  impact: 'REVENUE' | 'EXPERIENCE' | 'SATISFACTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

// ===============================
// OPCIONES DE CONFIGURACIÓN
// ===============================

export interface CRMAgentOptions {
  tenantId: string;
  similarityThreshold?: number; // 0.7 por defecto
  maxResults?: number; // 10 por defecto
  enableAnalytics?: boolean; // true por defecto
  pricing?: {
    markupPercentage?: number; // 20% por defecto
    minimumMargin?: number; // 15% por defecto
  };
}

export interface SearchOptions {
  type?: 'event' | 'client' | 'quote' | 'product';
  limit?: number;
  threshold?: number;
  tenantId?: string;
  includeEntity?: boolean;
  filters?: {
    status?: EventStatus | QuoteStatus;
    dateRange?: { start: Date; end: Date };
    priceRange?: { min: number; max: number };
    clientType?: ClientType;
  };
}

// ===============================
// TIPOS DE RESPUESTA
// ===============================

export interface CRMResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime?: number;
    confidence?: number;
    suggestions?: string[];
  };
}

export interface EventSuggestion {
  eventId: string;
  title: string;
  similarity: number;
  priceComparison: {
    suggested: number;
    historical: number;
    difference: number;
    reason: string;
  };
  recommendations: string[];
}

// ===============================
// TIPOS PARA WHATSAPP AGENT
// ===============================

export interface WhatsAppIntentClassification {
  intent: 'greeting' | 'event_inquiry' | 'quote_request' | 'availability_check' | 
          'service_info' | 'modify_event' | 'cancel_event' | 'general_question' | 'goodbye';
  confidence: number;
  entities: WhatsAppEntity[];
  needsCRMAgent: boolean;
  suggestedResponse?: string;
}

export interface WhatsAppEntity {
  type: 'person_name' | 'event_type' | 'date' | 'guest_count' | 'budget' | 'email' | 'phone';
  value: string;
  confidence: number;
  position?: { start: number; end: number };
}

export interface WhatsAppConversationState {
  phase: 'initial' | 'collecting_info' | 'processing' | 'escalated' | 'completed';
  missingInfo: string[];
  collectedData: Record<string, any>;
  retryCount: number;
  lastActivity: Date;
}

export interface WhatsAppEscalationDecision {
  shouldEscalate: boolean;
  reason: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  suggestedAgent?: 'crm' | 'human';
}