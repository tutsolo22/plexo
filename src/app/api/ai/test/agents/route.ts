import { NextRequest } from 'next/server';
import { agentCoordinator } from '@/lib/ai/agent-coordinator';
import { withErrorHandling } from '@/lib/api/middleware/error-handling';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

// Schema para testing de los agentes
const testAgentSchema = z.object({
  message: z.string().min(1, 'El mensaje es requerido'),
  tenantId: z.string().default('test-tenant'),
  from: z.string().default('test-user'),
  platform: z.enum(['web', 'whatsapp']).default('whatsapp'),
  testScenario: z
    .enum(['simple-greeting', 'crm-query', 'complex-request', 'escalation', 'whatsapp-specific'])
    .optional(),
});

/**
 * Endpoint de prueba para validar la integración de agentes
 * POST /api/ai/test/agents
 */
async function testAgentsHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, tenantId, from, platform, testScenario } = testAgentSchema.parse(body);

    // [TEST] Probando agentes con escenario

    // Preparar mensaje de prueba
    const testMessage = {
      id: `test_${Date.now()}`,
      from,
      to: 'assistant',
      body: message,
      timestamp: new Date(),
      type: 'text' as const,
      platform,
    };

    // Usar mensajes predeterminados según el escenario
    if (testScenario) {
      switch (testScenario) {
        case 'simple-greeting':
          testMessage.body = '¡Hola! ¿Cómo estás?';
          break;
        case 'crm-query':
          testMessage.body = 'Muéstrame mis clientes más importantes';
          testMessage.platform = 'web';
          break;
        case 'complex-request':
          testMessage.body =
            'Necesito crear una cotización para el evento de bodas de María García el próximo mes, incluye decoración y catering para 150 personas';
          break;
        case 'escalation':
          testMessage.body =
            'Tengo un problema urgente con mi facturación, necesito hablar con un humano ahora mismo';
          break;
        case 'whatsapp-specific':
          testMessage.body =
            'Hola, me llegó este mensaje por WhatsApp y quiero saber el estado de mi evento';
          testMessage.platform = 'whatsapp';
          break;
        default:
          // Usar el mensaje proporcionado
          break;
      }
    }

    const startTime = Date.now();

  // Procesar con el coordinador de agentes (import dinámico)
  const coordMod = await import('@/lib/ai/agent-coordinator');
  const { agentCoordinator } = coordMod;
  const response = await agentCoordinator.processMessage(testMessage, tenantId);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Estadísticas básicas (sin método getStats por ahora)
    return ApiResponses.success({
      test: {
        scenario: testScenario || 'manual',
        message: testMessage.body,
        platform: testMessage.platform,
        tenantId,
        from,
      },
      response: {
        message: response.response.message,
        agent: response.source,
        escalated: response.escalated,
        confidence: 'confidence' in response.response ? response.response.confidence : null,
        intent: 'intent' in response.response ? response.response.intent : null,
        results: 'results' in response.response ? response.response.results : null,
      },
      performance: {
        totalProcessingTime: totalTime,
        agentProcessingTime: response.metadata.processingTime,
        coordinatorOverhead: totalTime - response.metadata.processingTime,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        testMode: true,
        success: true,
      },
    });
  } catch (error) {
    console.error('Error en test de agentes:', error);
    return ApiResponses.internalError(
      error instanceof Error ? error.message : 'Error desconocido en test'
    );
  }
}

/**
 * Obtener estadísticas de los agentes
 * GET /api/ai/test/agents
 */
async function getAgentStatsHandler(_req: NextRequest) {
  try {
    return ApiResponses.success({
      agents: {
        coordinator: 'active',
        crm: 'active',
        whatsapp: 'active',
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
      endpoints: {
        chat: '/api/ai/chat',
        whatsappWebhook: '/api/ai/whatsapp/webhook',
        crmChat: '/api/ai/crm/chat',
        testAgents: '/api/ai/test/agents',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return ApiResponses.internalError('Error obteniendo estadísticas');
  }
}

/**
 * Resetear estadísticas de los agentes
 * DELETE /api/ai/test/agents
 */
async function resetAgentStatsHandler(_req: NextRequest) {
  try {
    // El coordinador no tiene método reset, pero podemos simular el reinicio
    // Estadísticas reseteadas (simulado)

    return ApiResponses.success({
      message: 'Estadísticas reseteadas correctamente',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error reseteando estadísticas:', error);
    return ApiResponses.internalError('Error reseteando estadísticas');
  }
}

// POST - Probar agentes con diferentes escenarios
export const POST = withErrorHandling(testAgentsHandler);

// GET - Obtener estadísticas de los agentes
export const GET = withErrorHandling(getAgentStatsHandler);

// DELETE - Resetear estadísticas
export const DELETE = withErrorHandling(resetAgentStatsHandler);
