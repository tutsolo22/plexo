import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const EmailQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['sent', 'failed', 'delivered', 'opened', 'clicked']).optional(),
  template: z.enum(['basic', 'professional', 'custom']).optional(),
  quoteId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional()
});

/**
 * GET /api/emails - Obtener lista de emails enviados
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = EmailQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      template: searchParams.get('template') || undefined,
      quoteId: searchParams.get('quoteId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined
    });

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.template) {
      where.template = query.template;
    }

    if (query.quoteId) {
      where.quoteId = query.quoteId;
    }

    if (query.dateFrom && query.dateTo) {
      where.sentAt = {
        gte: new Date(query.dateFrom),
        lte: new Date(query.dateTo)
      };
    } else if (query.dateFrom) {
      where.sentAt = { gte: new Date(query.dateFrom) };
    } else if (query.dateTo) {
      where.sentAt = { lte: new Date(query.dateTo) };
    }

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { recipientEmail: { contains: query.search, mode: 'insensitive' } },
        { quote: { 
          quoteNumber: { contains: query.search, mode: 'insensitive' } 
        }},
        { quote: { 
          client: { 
            name: { contains: query.search, mode: 'insensitive' } 
          }
        }}
      ];
    }

    // Obtener emails con paginación
    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        include: {
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              total: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true
                }
              }
            }
          }
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.emailLog.count({ where })
    ]);

    // Calcular estadísticas
    const stats = await prisma.emailLog.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calcular tasa de apertura
    const totalSent = statusStats['sent'] || 0;
    const totalOpened = statusStats['opened'] || 0;
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        emails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: {
          total,
          byStatus: statusStats,
          openRate: Math.round(openRate * 100) / 100
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros de consulta inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Error obteniendo emails:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}