/**
 * Utilidades para optimización de consultas de base de datos
 * Sistema de Gestión de Eventos V3
 * 
 * @author Manuel Antonio Tut Solorzano
 * @version 3.0.0
 * @date 2025-10-17
 */

import { prisma } from './prisma';

/**
 * Cache para consultas frecuentes con optimizaciones específicas
 */
export class DatabaseOptimizer {
  
  /**
   * Obtener estadísticas del dashboard con queries optimizadas
   */
  static async getDashboardStats(tenantId: string, startDate: Date, endDate: Date) {
    // Usar transacción para consultas relacionadas
    return await prisma.$transaction(async (tx) => {
      // Query optimizada con índices específicos
      const [events, quotes, clients] = await Promise.all([
        // Eventos con índice en tenantId + createdAt
        tx.event.count({
          where: {
            tenantId,
            createdAt: { gte: startDate, lte: endDate }
          }
        }),

        // Cotizaciones con índice compuesto
        tx.quote.findMany({
          where: {
            tenantId,
            createdAt: { gte: startDate, lte: endDate }
          },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true
          }
        }),

        // Clientes solo conteo
        tx.client.count({
          where: {
            tenantId,
            createdAt: { gte: startDate, lte: endDate }
          }
        })
      ]);

      return { events, quotes, clients };
    });
  }

  /**
   * Top clientes optimizado con agregaciones en BD
   */
  static async getTopClients(tenantId: string, startDate: Date, endDate: Date, limit: number = 5) {
    // Query optimizada con agregación directa en BD
    const result = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.email,
        COUNT(q.id)::int as quotes_count,
        COALESCE(SUM(q.total), 0)::float as total_revenue
      FROM "Client" c
      LEFT JOIN "Quote" q ON c.id = q."clientId" 
        AND q.status = 'APPROVED'
        AND q."createdAt" >= ${startDate}
        AND q."createdAt" <= ${endDate}
      WHERE c."tenantId" = ${tenantId}
      GROUP BY c.id, c.name, c.email
      HAVING COUNT(q.id) > 0
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;

    return result;
  }

  /**
   * Eventos por mes con una sola query
   */
  static async getEventsByMonth(tenantId: string, monthsBack: number = 6) {
    const result = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*)::int as count
      FROM "Event"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= NOW() - INTERVAL '${monthsBack} months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    return result;
  }

  /**
   * Revenue por mes optimizado
   */
  static async getRevenueByMonth(tenantId: string, monthsBack: number = 6) {
    const result = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COALESCE(SUM(total), 0)::float as revenue
      FROM "Quote"
      WHERE "tenantId" = ${tenantId}
        AND status = 'APPROVED'
        AND "createdAt" >= NOW() - INTERVAL '${monthsBack} months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    return result;
  }

  /**
   * Estadísticas de cotizaciones por estado
   */
  static async getQuoteStatusStats(tenantId: string, startDate: Date, endDate: Date) {
    const result = await prisma.$queryRaw`
      SELECT 
        status,
        COUNT(*)::int as count
      FROM "Quote"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY status
      ORDER BY count DESC
    `;

    return result;
  }

  /**
   * Próximos eventos optimizado
   */
  static async getUpcomingEvents(tenantId: string, limit: number = 5) {
    return await prisma.event.findMany({
      where: {
        tenantId,
        startDate: { 
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Próximos 30 días
        }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        status: true,
        client: {
          select: { name: true }
        }
      },
      orderBy: { startDate: 'asc' },
      take: limit
    });
  }

  /**
   * Obtener lista de clientes con paginación optimizada
   */
  static async getClientsPaginated(
    tenantId: string, 
    page: number = 1, 
    limit: number = 10,
    search?: string
  ) {
    const skip = (page - 1) * limit;
    
    const whereClause = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };

    // Usar transacción para count + data en paralelo
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          type: true,
          createdAt: true,
          _count: {
            select: {
              events: true,
              quotes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.client.count({ where: whereClause })
    ]);

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Performance monitoring - detectar queries lentas
   */
  static async getQueryPerformanceReport() {
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time
      FROM pg_stat_statements 
      WHERE mean_time > 100  -- Queries que toman más de 100ms en promedio
      ORDER BY mean_time DESC
      LIMIT 10
    `;

    return slowQueries;
  }

  /**
   * Obtener estadísticas de índices
   */
  static async getIndexUsageStats() {
    const indexStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE idx_tup_read > 0
      ORDER BY idx_tup_read DESC
      LIMIT 20
    `;

    return indexStats;
  }
}

/**
 * Middleware para logging de queries lentas
 */
export const queryPerformanceMiddleware = (threshold: number = 100) => {
  return prisma.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const end = Date.now();
    const duration = end - start;

    if (duration > threshold) {
      console.warn(`🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
      console.warn(`   Args:`, JSON.stringify(params.args, null, 2));
    }

    return result;
  });
};

/**
 * Índices recomendados para optimización
 */
export const RECOMMENDED_INDEXES = {
  // Índice compuesto para eventos por tenant y fecha
  events_tenant_date: `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_events_tenant_created"
    ON "Event" ("tenantId", "createdAt" DESC);
  `,
  
  // Índice para cotizaciones por tenant, estado y fecha
  quotes_tenant_status_date: `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_quotes_tenant_status_created"
    ON "Quote" ("tenantId", "status", "createdAt" DESC);
  `,
  
  // Índice para clientes por tenant y búsqueda
  clients_tenant_search: `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_clients_tenant_name"
    ON "Client" ("tenantId", "name");
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_clients_tenant_email"
    ON "Client" ("tenantId", "email");
  `,
  
  // Índice para eventos próximos
  events_upcoming: `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_events_upcoming"
    ON "Event" ("tenantId", "startDate") 
    WHERE "startDate" >= NOW();
  `,
  
  // Índice para cotizaciones aprobadas
  quotes_approved: `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_quotes_approved"
    ON "Quote" ("tenantId", "total") 
    WHERE status = 'APPROVED';
  `
} as const;