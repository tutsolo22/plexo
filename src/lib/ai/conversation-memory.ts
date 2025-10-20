import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface ConversationContext {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface CreateConversationOptions {
  userId: string;
  platform?: string;
  userPhone?: string;
  metadata?: Record<string, any>;
}

export interface AddMessageOptions {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export class ConversationMemoryService {
  /**
   * Crea una nueva conversación
   */
  async createConversation(options: CreateConversationOptions): Promise<string> {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          id: uuidv4(),
          userId: options.userId,
          platform: options.platform || 'web',
          userPhone: options.userPhone || null,
          status: 'active',
          metadata: options.metadata || {},
        },
      });

      return conversation.id;
    } catch (error) {
      console.error('Error creando conversación:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Obtiene una conversación por ID
   */
  async getConversation(conversationId: string): Promise<ConversationContext | null> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        return null;
      }

      return {
        id: conversation.id,
        userId: conversation.userId,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          metadata: msg.metadata as Record<string, any>,
          timestamp: msg.createdAt,
        })),
        metadata: conversation.metadata as Record<string, any>,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      console.error('Error obteniendo conversación:', error);
      throw new Error('Failed to get conversation');
    }
  }

  /**
   * Agrega un mensaje a la conversación
   */
  async addMessage(options: AddMessageOptions): Promise<void> {
    try {
      await prisma.conversationMessage.create({
        data: {
          id: uuidv4(),
          conversationId: options.conversationId,
          role: options.role,
          content: options.content,
          metadata: options.metadata || {},
        },
      });

      // Actualizar timestamp de la conversación
      await prisma.conversation.update({
        where: { id: options.conversationId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      console.error('Error agregando mensaje:', error);
      throw new Error('Failed to add message');
    }
  }

  /**
   * Obtiene el contexto de conversación para el agente AI
   */
  async getConversationContext(conversationId: string, limit = 20): Promise<any[]> {
    try {
      const messages = await prisma.conversationMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Invertir para obtener orden cronológico
      return messages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      }));
    } catch (error) {
      console.error('Error obteniendo contexto:', error);
      return [];
    }
  }

  /**
   * Busca conversaciones por usuario
   */
  async getUserConversations(userId: string, limit = 10): Promise<ConversationContext[]> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Solo el último mensaje para preview
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      return conversations.map(conv => ({
        id: conv.id,
        userId: conv.userId,
        messages: conv.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          metadata: msg.metadata as Record<string, any>,
          timestamp: msg.createdAt,
        })),
        metadata: conv.metadata as Record<string, any>,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    } catch (error) {
      console.error('Error obteniendo conversaciones del usuario:', error);
      throw new Error('Failed to get user conversations');
    }
  }

  /**
   * Busca conversaciones por teléfono (WhatsApp)
   */
  async getConversationByPhone(phone: string): Promise<ConversationContext | null> {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          userPhone: phone,
          status: 'active',
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversation) {
        return null;
      }

      return {
        id: conversation.id,
        userId: conversation.userId,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          metadata: msg.metadata as Record<string, any>,
          timestamp: msg.createdAt,
        })),
        metadata: conversation.metadata as Record<string, any>,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      console.error('Error obteniendo conversación por teléfono:', error);
      return null;
    }
  }

  /**
   * Finaliza una conversación
   */
  async endConversation(conversationId: string, reason?: string): Promise<void> {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'ended',
          endedAt: new Date(),
          metadata: {
            endReason: reason || 'user_ended',
          },
        },
      });
    } catch (error) {
      console.error('Error finalizando conversación:', error);
      throw new Error('Failed to end conversation');
    }
  }

  /**
   * Analiza estadísticas de conversaciones
   */
  async getConversationStats(userId?: string) {
    try {
      const where = userId ? { userId } : {};

      const stats = await prisma.conversation.aggregate({
        where,
        _count: {
          id: true,
        },
      });

      const messageStats = await prisma.conversationMessage.aggregate({
        where: userId
          ? {
              conversation: { userId },
            }
          : {},
        _count: {
          id: true,
        },
      });

      const activeConversations = await prisma.conversation.count({
        where: {
          ...where,
          status: 'active',
        },
      });

      const avgMessagesPerConversation =
        stats._count.id > 0 ? messageStats._count.id / stats._count.id : 0;

      return {
        totalConversations: stats._count.id,
        totalMessages: messageStats._count.id,
        activeConversations,
        avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error('Failed to get conversation stats');
    }
  }

  /**
   * Limpia conversaciones antiguas
   */
  async cleanupOldConversations(daysOld = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.conversation.deleteMany({
        where: {
          status: 'ended',
          endedAt: {
            not: null,
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error limpiando conversaciones:', error);
      throw new Error('Failed to cleanup conversations');
    }
  }

  /**
   * Busca conversaciones por contenido de mensaje
   */
  async searchConversations(
    query: string,
    userId?: string,
    limit = 10
  ): Promise<ConversationContext[]> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          ...(userId && { userId }),
          messages: {
            some: {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        },
        include: {
          messages: {
            where: {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      return conversations.map(conv => ({
        id: conv.id,
        userId: conv.userId,
        messages: conv.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          metadata: msg.metadata as Record<string, any>,
          timestamp: msg.createdAt,
        })),
        metadata: conv.metadata as Record<string, any>,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    } catch (error) {
      console.error('Error buscando conversaciones:', error);
      throw new Error('Failed to search conversations');
    }
  }
}

// Instancia singleton del servicio
export const conversationMemoryService = new ConversationMemoryService();
