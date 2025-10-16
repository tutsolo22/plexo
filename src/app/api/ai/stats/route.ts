import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// GET /api/ai/stats - Estadísticas de conversaciones IA
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // const { searchParams } = new URL(request.url)
    // const userId = searchParams.get('userId')
    // const days = parseInt(searchParams.get('days') || '30')

    // TODO: Implementar estadísticas cuando el modelo conversation esté disponible
    const mockStats = {
      totalConversations: 0,
      totalMessages: 0,
      averageLength: 0,
      platforms: {},
      conversationsByPeriod: [],
      messagesByDay: [],
      responseTimeAnalysis: {
        averageResponseTime: 0,
        medianResponseTime: 0,
        responses: [],
      },
      conversationStatus: [],
      topQueries: [],
      satisfactionRating: 0,
    };

    return NextResponse.json({
      success: true,
      data: mockStats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas IA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
