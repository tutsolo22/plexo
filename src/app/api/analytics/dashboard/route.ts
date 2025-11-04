// API para Dashboard de Analytics - Métricas principales con Redis Cache
// /api/analytics/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redisCache, CacheKeys, ANALYTICS_TTL } from '@/lib/redis';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6'; // Últimos 6 meses por defecto

    // Verificar cache primero
    const cacheKey = CacheKeys.ANALYTICS_DASHBOARD(period, session.user.tenantId);
    const cachedData = await redisCache.get(cacheKey);

    if (cachedData) {
      console.log('📊 Analytics data served from cache');
      return NextResponse.json({
        ...cachedData,
        fromCache: true,
        cacheKey
      });
    }

    console.log('📊 Generating fresh analytics data...');

    // Calcular fechas para el período seleccionado
    const endDate = endOfMonth(new Date());
    const startDate = startOfMonth(subMonths(new Date(), parseInt(period) - 1));

    // 1. Métricas principales
    const totalEvents = await prisma.event.count({
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const totalQuotes = await prisma.quote.count({
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const totalClients = await prisma.client.count({
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    // 2. Ingresos totales (cotizaciones aprobadas)
    const approvedQuotes = await prisma.quote.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'APPROVED_BY_MANAGER',
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    const totalRevenue = approvedQuotes.reduce((sum, quote) => sum + Number(quote.total), 0);

    // 3. Estadísticas de cotizaciones por estado
    const quotesByStatus = await prisma.quote.groupBy({
      by: ['status'],
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: {
        status: true
      }
    });

    // 4. Eventos por mes (últimos 6 meses)
    const eventsByMonth = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      
      const count = await prisma.event.count({
        where: {
          tenantId: session.user.tenantId,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      });

      eventsByMonth.push({
        month: format(monthStart, 'MMM yyyy', { locale: es }),
        count,
        date: monthStart.toISOString()
      });
    }

    // 5. Ingresos por mes
    const revenueByMonth = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      
      const monthQuotes = await prisma.quote.findMany({
        where: {
          tenantId: session.user.tenantId,
          status: 'APPROVED_BY_MANAGER',
          createdAt: { gte: monthStart, lte: monthEnd }
        },
        select: { total: true }
      });

      const monthRevenue = monthQuotes.reduce((sum, quote) => sum + Number(quote.total), 0);

      revenueByMonth.push({
        month: format(monthStart, 'MMM yyyy', { locale: es }),
        revenue: monthRevenue,
        date: monthStart.toISOString()
      });
    }

    // 6. Top clientes por ingresos
    const topClients = await prisma.client.findMany({
      where: {
        tenantId: session.user.tenantId
      },
      include: {
        quotes: {
          where: {
            status: 'APPROVED_BY_MANAGER',
            createdAt: { gte: startDate, lte: endDate }
          },
          select: { total: true }
        }
      },
      take: 10
    });

    const clientsWithRevenue = topClients
      .map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        totalRevenue: client.quotes.reduce((sum: number, quote: any) => sum + Number(quote.total), 0),
        quotesCount: client.quotes.length
      }))
      .filter(client => client.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // 7. Estadísticas de emails
    let emailStats = null;
    try {
      const emailsCount = await prisma.emailLog.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      });

      const emailsOpened = await prisma.emailLog.count({
        where: {
          status: 'opened',
          createdAt: { gte: startDate, lte: endDate }
        }
      });

      emailStats = {
        totalSent: emailsCount,
        totalOpened: emailsOpened,
        openRate: emailsCount > 0 ? (emailsOpened / emailsCount * 100).toFixed(2) : 0
      };
    } catch (error) {
      // Si no existe la tabla EmailLog, ignorar
      console.log('EmailLog table not available');
    }

    // 8. Próximos eventos (siguiente mes)
    const nextMonth = endOfMonth(new Date());
    const upcomingEvents = await prisma.event.findMany({
      where: {
        tenantId: session.user.tenantId,
        startDate: { gte: new Date(), lte: nextMonth }
      },
      include: {
        client: { select: { name: true } }
      },
      orderBy: { startDate: 'asc' },
      take: 5
    });

    // Construir respuesta
    const analytics = {
      period: `${period} meses`,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      
      // Métricas principales
      summary: {
        totalEvents,
        totalQuotes,
        totalClients,
        totalRevenue,
        averageQuoteValue: totalQuotes > 0 ? (totalRevenue / totalQuotes).toFixed(2) : 0
      },

      // Gráficos
      charts: {
        eventsByMonth,
        revenueByMonth,
        quotesByStatus: quotesByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
          label: getStatusLabel(item.status)
        }))
      },

      // Listas
      topClients: clientsWithRevenue,
      upcomingEvents: upcomingEvents.map(event => ({
        id: event.id,
        title: event.title,
        client: event.client?.name || 'Cliente no asignado',
        startDate: event.startDate,
        status: event.status
      })),

      // Estadísticas adicionales
      emailStats,

      // Metadata
      generatedAt: new Date().toISOString(),
      user: {
        id: session.user.id,
        name: session.user.name
      },
      fromCache: false
    };

    // Guardar en cache por 15 minutos
    await redisCache.set(cacheKey, analytics, ANALYTICS_TTL);
    console.log('💾 Analytics data cached successfully');

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error al generar analytics:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Helper function para labels de estado
function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'DRAFT': 'Borrador',
    'SENT': 'Enviada',
    'APPROVED': 'Aprobada',
    'REJECTED': 'Rechazada'
  };
  return labels[status] || status;
}
