/**
 * API Endpoint para estadísticas del sistema de aprendizaje RAG
 * GET /api/ai/learning/stats
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { learningSystem } from '@/lib/ai/learning-system';
import { ApiResponses } from '@/lib/api/response-builder';
import { withErrorHandling } from '@/lib/api/middleware';

async function learningStatsHandler(_req: NextRequest) {
  // Obtener sesión
  const session = await auth();

  if (!session?.user) {
    return ApiResponses.unauthorized('No autenticado');
  }

  if (!session.user.tenantId) {
    return ApiResponses.unauthorized('Usuario sin tenant asignado');
  }

  try {
    // Obtener estadísticas de aprendizaje
    const stats = await learningSystem.getLearningStats(session.user.tenantId);

    return ApiResponses.success({
      stats,
      message: 'Estadísticas obtenidas correctamente',
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return ApiResponses.internalError(
      error instanceof Error ? error.message : 'Error desconocido'
    );
  }
}

export const GET = withErrorHandling(learningStatsHandler);
