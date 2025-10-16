import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/hooks/use-dashboard-stats';

/**
 * API Route para obtener estadísticas del dashboard
 * GET /api/dashboard/stats
 */
export async function GET(_request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener estadísticas
    const stats = await getDashboardStats();

    // Convertir Decimal a number para serialización JSON
    const serializedStats = {
      ...stats,
      recentQuotes: stats.recentQuotes.map(quote => ({
        ...quote,
        total: quote.total.toNumber(),
      })),
    };

    return NextResponse.json(serializedStats);
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
