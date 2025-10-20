// Archivo temporal para build - modelos conversation no implementados en Prisma
import { v4 as uuidv4 } from 'uuid';

export interface CreateConversationOptions {
  userId: string;
  platform?: string;
  userPhone?: string;
  metadata?: any;
}

export interface CreateMessageOptions {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  createdAt: Date;
}

export interface ConversationWithMessages {
  id: string;
  userId: string;
  platform: string;
  userPhone?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessage[];
}

export class ConversationMemory {
  private static instance: ConversationMemory;

  static getInstance(): ConversationMemory {
    if (!ConversationMemory.instance) {
      ConversationMemory.instance = new ConversationMemory();
    }
    return ConversationMemory.instance;
  }

  async createConversation(_options: CreateConversationOptions): Promise<string> {
    // TODO: Implementar con modelos Prisma reales
    return uuidv4();
  }

  async getConversation(_conversationId: string): Promise<ConversationWithMessages | null> {
    // TODO: Implementar con modelos Prisma reales
    return null;
  }

  async addMessage(_options: CreateMessageOptions): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async getRecentMessages(
    _conversationId: string,
    _limit: number = 10
  ): Promise<ConversationMessage[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }

  async getConversationContext(
    _conversationId: string,
    _limit: number = 10
  ): Promise<ConversationMessage[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }

  async getUserConversations(
    _userId: string,
    _limit: number = 20
  ): Promise<ConversationWithMessages[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }

  async findActiveConversation(
    _userId: string,
    _platform: string
  ): Promise<ConversationWithMessages | null> {
    // TODO: Implementar con modelos Prisma reales
    return null;
  }

  async markConversationEnded(_conversationId: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async endConversation(_conversationId: string, _reason?: string): Promise<void> {
    // TODO: Implementar con modelos Prisma reales
  }

  async getConversationStats(): Promise<any> {
    // TODO: Implementar con modelos Prisma reales
    return {
      totalConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0,
      activeConversations: 0,
    };
  }

  async cleanupOldConversations(_daysOld: number = 30): Promise<number> {
    // TODO: Implementar con modelos Prisma reales
    return 0;
  }

  async searchConversations(
    _query: string,
    _limit: number = 50
  ): Promise<ConversationWithMessages[]> {
    // TODO: Implementar con modelos Prisma reales
    return [];
  }
}

export const conversationMemory = ConversationMemory.getInstance();

// Alias para compatibilidad con imports existentes
export const conversationMemoryService = conversationMemory;
export const ConversationMemoryService = ConversationMemory;
