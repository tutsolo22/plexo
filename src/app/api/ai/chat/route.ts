import { NextRequest } from 'next/server';
import { eventAgentService } from '@/lib/ai/agent';
import { conversationMemoryService } from '@/lib/ai/conversation-memory';
import { withValidation } from '@/lib/api/middleware/validation';
import { withErrorHandling } from '@/lib/api/middleware/error-handling';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

// Schema de validación para el chat
const chatRequestSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(1000, 'El mensaje es demasiado largo'),
  conversationId: z.string().optional(),
  sessionId: z.string().optional(), // Para compatibilidad con la demo
  userId: z.string().optional(),
  platform: z.enum(['web', 'whatsapp']).default('web'),
  userPhone: z.string().optional(),
});

async function chatHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationId, sessionId, userId, platform, userPhone } = chatRequestSchema.parse(body);

    // Usar sessionId como conversationId si no se proporciona conversationId
    let currentConversationId = conversationId || sessionId;
    let conversationContext: Array<{ role: string; content: string }> = [];

    // Si no hay conversación, crear una nueva
    if (!currentConversationId) {
      currentConversationId = await conversationMemoryService.createConversation({
        userId,
        platform,
        userPhone,
        metadata: {
          startedAt: new Date().toISOString(),
          userAgent: req.headers.get('user-agent'),
        }
      });
    } else {
      // Obtener contexto de conversación existente
      conversationContext = await conversationMemoryService.getConversationContext(
        currentConversationId,
        10 // Últimos 10 mensajes para contexto
      );
    }

    // Guardar mensaje del usuario
    await conversationMemoryService.addMessage({
      conversationId: currentConversationId,
      role: 'user',
      content: message,
      metadata: {
        platform,
        timestamp: new Date().toISOString(),
      }
    });

    // Procesar mensaje con el agente AI
    const agentResponse = await eventAgentService.processMessage(
      message,
      currentConversationId,
      conversationContext
    );

    // Guardar respuesta del agente
    await conversationMemoryService.addMessage({
      conversationId: currentConversationId,
      role: 'assistant',
      content: agentResponse.message,
      metadata: {
        functionCalls: agentResponse.functionCalls,
        timestamp: new Date().toISOString(),
      }
    });

    return ApiResponses.success({
      message: agentResponse.message,
      conversationId: currentConversationId,
      functionCalls: agentResponse.functionCalls,
      platform,
    });

  } catch (error) {
    console.error('Error en chat AI:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest('Datos de entrada inválidos', error.errors);
    }

    return ApiResponses.internalError('Error procesando mensaje');
  }
}

// POST /api/ai/chat - Enviar mensaje al agente
export const POST = withErrorHandling(
  withValidation(chatRequestSchema)(
    chatHandler
  )
);

// GET /api/ai/chat?conversationId=xxx - Obtener historial de conversación
export const GET = withErrorHandling(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (conversationId) {
      // Obtener conversación específica
      const conversation = await conversationMemoryService.getConversation(conversationId);
      
      if (!conversation) {
        return ApiResponses.notFound('Conversación no encontrada');
      }

      return ApiResponses.success(conversation);
    } else if (userId) {
      // Obtener conversaciones del usuario
      const conversations = await conversationMemoryService.getUserConversations(userId, 20);
      return ApiResponses.success(conversations);
    } else {
      return ApiResponses.badRequest('Se requiere conversationId o userId');
    }

  } catch (error) {
    console.error('Error obteniendo conversación:', error);
    return ApiResponses.internalError('Error obteniendo conversación');
  }
});

// DELETE /api/ai/chat - Finalizar conversación
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const reason = searchParams.get('reason') || 'user_ended';

    if (!conversationId) {
      return ApiResponses.badRequest('Se requiere conversationId');
    }

    await conversationMemoryService.endConversation(conversationId, reason);

    return ApiResponses.success({
      message: 'Conversación finalizada',
      conversationId,
      endedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error finalizando conversación:', error);
    return ApiResponses.internalError('Error finalizando conversación');
  }
});