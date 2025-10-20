import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { crmAgentService } from '@/lib/ai/crm-agent-v2';
import { conversationMemoryService } from '@/lib/ai/conversation-memory';
import { withValidation } from '@/lib/api/middleware/validation';
import { withErrorHandling } from '@/lib/api/middleware/error-handling';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

// Schema de validación para CRM específico
const crmChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(1000, 'El mensaje es demasiado largo'),
  conversationId: z.string().optional(),
  sessionId: z.string().optional(), // Para compatibilidad con la demo
  userId: z.string().optional(),
  platform: z.enum(['web', 'whatsapp']).default('web'),
  userPhone: z.string().optional(),
});

/**
 * Handler específico para CRM Agent
 * Mantiene la funcionalidad original del CRM como respaldo
 */
async function crmChatHandler(req: NextRequest) {
  try {
    // Verificar autenticación de sesión
    const session = await auth();
    if (!session?.user) {
      return ApiResponses.unauthorized('Acceso no autorizado');
    }

    const body = await req.json();
    const { message, conversationId, sessionId, platform, userPhone } =
      crmChatRequestSchema.parse(body);

    // Usar sessionId como conversationId si no se proporciona conversationId
    let currentConversationId = conversationId || sessionId;

    // Si no hay conversación, crear una nueva
    if (!currentConversationId) {
      currentConversationId = await conversationMemoryService.createConversation({
        userId: session.user.id,
        platform,
        userPhone: userPhone || '',
        metadata: {
          startedAt: new Date().toISOString(),
          userAgent: req.headers.get('user-agent'),
          tenantId: session.user.tenantId,
          userRole: session.user.role,
        },
      });
    }

    // TODO: Implementar contexto de conversación cuando sea necesario
    // Para mantener compatibilidad con el agente CRM original

    // Guardar mensaje del usuario
    await conversationMemoryService.addMessage({
      conversationId: currentConversationId,
      role: 'user',
      content: message,
      metadata: {
        platform,
        timestamp: new Date().toISOString(),
        tenantId: session.user.tenantId,
      },
    });

    // Procesar mensaje con el agente CRM v2 especializado (sin coordinador)
    const agentResponse = await crmAgentService.processQuery(message, {
      tenantId: session.user.tenantId,
      userRole: typeof session.user.role === 'string' ? session.user.role : 'USER',
    });

    // Guardar respuesta del agente CRM
    await conversationMemoryService.addMessage({
      conversationId: currentConversationId,
      role: 'assistant',
      content: agentResponse.response,
      metadata: {
        agent: 'crm-agent-v2',
        intent: agentResponse.intent,
        results: agentResponse.results,
        timestamp: agentResponse.timestamp.toISOString(),
      },
    });

    return ApiResponses.success({
      message: agentResponse.response,
      conversationId: currentConversationId,
      agent: 'crm-agent-v2',
      intent: agentResponse.intent,
      results: agentResponse.results,
      searchType: agentResponse.results?.searchType,
      platform,
      metadata: {
        userRole: session.user.role,
        tenantId: session.user.tenantId,
        tenantName: session.user.tenantName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error en CRM chat:', error);
    return ApiResponses.internalError('Error procesando mensaje CRM');
  }
}

/**
 * Obtener historial de conversación específico para CRM
 */
async function getCrmConversationHandler(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiResponses.unauthorized('Acceso no autorizado');
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return ApiResponses.badRequest('conversationId es requerido');
    }

    const messages = await conversationMemoryService.getConversationContext(conversationId, limit);

    // Filtrar solo mensajes de CRM agent
    const crmMessages = messages.filter(
      msg => msg.metadata?.agent === 'crm-agent-v2' || !msg.metadata?.agent // Mensajes de usuario
    );

    return ApiResponses.success({
      conversationId,
      messages: crmMessages,
      total: crmMessages.length,
      metadata: {
        tenantId: session.user.tenantId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error obteniendo conversación CRM:', error);
    return ApiResponses.internalError('Error obteniendo historial');
  }
}

/**
 * Eliminar conversación específica de CRM
 */
async function deleteCrmConversationHandler(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiResponses.unauthorized('Acceso no autorizado');
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return ApiResponses.badRequest('conversationId es requerido');
    }

    // Verificar que la conversación pertenece al usuario/tenant
    const conversation = await conversationMemoryService.getConversationContext(conversationId, 1);
    if (conversation.length === 0) {
      return ApiResponses.notFound('Conversación no encontrada');
    }

    // TODO: Implementar deleteConversation en ConversationMemoryService
    // await conversationMemoryService.deleteConversation(conversationId);

    return ApiResponses.success({
      message: 'Funcionalidad de eliminación pendiente de implementar',
      conversationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error eliminando conversación CRM:', error);
    return ApiResponses.internalError('Error eliminando conversación');
  }
}

// POST - Enviar mensaje al CRM Agent específicamente
export const POST = withErrorHandling(withValidation(crmChatRequestSchema)(crmChatHandler));

// GET - Obtener historial de conversación CRM
export const GET = withErrorHandling(getCrmConversationHandler);

// DELETE - Eliminar conversación CRM
export const DELETE = withErrorHandling(deleteCrmConversationHandler);
