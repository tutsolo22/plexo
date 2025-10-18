import { NextRequest } from 'next/server';
import { ApiResponses } from '@/lib/api/responses';

/**
 * Endpoint de debug simple para verificar que la API funciona
 */
export async function GET(req: NextRequest) {
  try {
    // Intentar importar los agentes para ver si hay errores
    let importStatus = {
      agentCoordinator: 'not_tested',
      whatsappAgent: 'not_tested',
      crmAgent: 'not_tested'
    };

    try {
      const { agentCoordinator } = await import('@/lib/ai/agent-coordinator');
      importStatus.agentCoordinator = agentCoordinator ? 'success' : 'failed_null';
    } catch (error) {
      importStatus.agentCoordinator = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    try {
      const { whatsappAgentService } = await import('@/lib/ai/whatsapp-agent');
      importStatus.whatsappAgent = whatsappAgentService ? 'success' : 'failed_null';
    } catch (error) {
      importStatus.whatsappAgent = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return ApiResponses.success({
      message: "Debug endpoint funcionando correctamente",
      timestamp: new Date().toISOString(),
      url: req.url,
      method: 'GET',
      importStatus
    });
  } catch (error) {
    console.error('Error en debug endpoint:', error);
    return ApiResponses.internalError('Error en debug endpoint');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    return ApiResponses.success({
      message: "Debug POST funcionando correctamente",
      timestamp: new Date().toISOString(),
      receivedBody: body,
      url: req.url,
      method: 'POST'
    });
  } catch (error) {
    console.error('Error en debug POST:', error);
    return ApiResponses.internalError('Error procesando POST en debug');
  }
}