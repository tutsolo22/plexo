export interface WidgetApiKey {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  isActive: boolean;
  rateLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  id: string;
  tenantId: string;
  businessName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConversation {
  id: string;
  tenantId: string;
  widgetConfigId: string;
  sessionId: string;
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetMessage {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface WidgetChatRequest {
  message: string;
  conversationId?: string;
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface WidgetChatResponse {
  response: string;
  conversationId: string;
  timestamp: string;
}

export interface WidgetInfoResponse {
  businessName: string;
  description: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  stats: {
    totalEvents: number;
    activeEvents: number;
    totalClients: number;
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
  }>;
}