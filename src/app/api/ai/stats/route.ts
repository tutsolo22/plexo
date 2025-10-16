import { NextRequest, NextResponse } from 'next/server';
import { conversationMemoryService } from '@/lib/ai/conversation-memory';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/middleware/auth';
import { withErrorHandling } from '@/lib/api/middleware/error-handling';
import { ApiResponses } from '@/lib/api/responses';

// GET /api/ai/stats - Obtener estadísticas del agente AI
export const GET = withErrorHandling(
  withAuth(['admin', 'manager'])(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const days = parseInt(searchParams.get('days') || '30');

        // Estadísticas generales de conversaciones
        const conversationStats = await conversationMemoryService.getConversationStats(userId || undefined);

        // Estadísticas por período
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        const conversationsByPeriod = await prisma.conversation.groupBy({
          by: ['platform'],
          where: {
            createdAt: { gte: dateFrom },
            ...(userId && { userId })
          },
          _count: {
            id: true
          }
        });

        const messagesByDay = await prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM conversation_messages cm
          JOIN conversations c ON cm.conversation_id = c.id
          WHERE cm.created_at >= ${dateFrom}
          ${userId ? prisma.$queryRaw`AND c.user_id = ${userId}` : prisma.$queryRaw``}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        ` as Array<{ date: string; count: bigint }>;

        // Funciones más utilizadas
        const functionUsage = await prisma.$queryRaw`
          SELECT 
            json_extract(metadata, '$.functionCalls[0].name') as function_name,
            COUNT(*) as usage_count
          FROM conversation_messages cm
          JOIN conversations c ON cm.conversation_id = c.id
          WHERE cm.role = 'assistant' 
            AND json_extract(metadata, '$.functionCalls') IS NOT NULL
            AND cm.created_at >= ${dateFrom}
            ${userId ? prisma.$queryRaw`AND c.user_id = ${userId}` : prisma.$queryRaw``}
          GROUP BY function_name
          ORDER BY usage_count DESC
          LIMIT 10
        ` as Array<{ function_name: string; usage_count: bigint }>;

        // Métricas de rendimiento
        const avgResponseTime = await prisma.$queryRaw`
          SELECT AVG(
            EXTRACT(EPOCH FROM (
              SELECT created_at 
              FROM conversation_messages cm2 
              WHERE cm2.conversation_id = cm1.conversation_id 
                AND cm2.role = 'assistant' 
                AND cm2.created_at > cm1.created_at 
              ORDER BY created_at ASC 
              LIMIT 1
            ) - cm1.created_at)
          ) as avg_seconds
          FROM conversation_messages cm1
          JOIN conversations c ON cm1.conversation_id = c.id
          WHERE cm1.role = 'user' 
            AND cm1.created_at >= ${dateFrom}
            ${userId ? prisma.$queryRaw`AND c.user_id = ${userId}` : prisma.$queryRaw``}
        ` as Array<{ avg_seconds: number }>;

        // Conversaciones activas vs finalizadas
        const conversationStatus = await prisma.conversation.groupBy({
          by: ['status'],
          where: {
            createdAt: { gte: dateFrom },
            ...(userId && { userId })
          },
          _count: {
            id: true
          }
        });

        const stats = {
          overview: conversationStats,
          period: {
            days,
            dateFrom: dateFrom.toISOString(),
            byPlatform: conversationsByPeriod.reduce((acc, item) => {
              acc[item.platform] = Number(item._count.id);
              return acc;
            }, {} as Record<string, number>),
            byStatus: conversationStatus.reduce((acc, item) => {
              acc[item.status] = Number(item._count.id);
              return acc;
            }, {} as Record<string, number>)
          },
          engagement: {
            messagesByDay: messagesByDay.map(item => ({
              date: item.date,
              count: Number(item.count)
            })),
            avgResponseTimeSeconds: avgResponseTime[0]?.avg_seconds ? 
              Math.round(avgResponseTime[0].avg_seconds * 100) / 100 : 0
          },
          aiUsage: {
            topFunctions: functionUsage.map(item => ({
              name: item.function_name,
              count: Number(item.usage_count)
            }))
          },
          timestamp: new Date().toISOString()
        };

        return ApiResponses.success(stats);

      } catch (error) {
        console.error('Error obteniendo estadísticas AI:', error);
        return ApiResponses.internalError('Error obteniendo estadísticas');
      }
    }
  )
);

// POST /api/ai/stats/cleanup - Limpiar conversaciones antiguas
export const POST = withErrorHandling(
  withAuth(['admin'])(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, daysOld = 90 } = body;

        if (action === 'cleanup') {
          const deletedCount = await conversationMemoryService.cleanupOldConversations(daysOld);
          
          return ApiResponses.success({
            message: `${deletedCount} conversaciones eliminadas`,
            deletedCount,
            daysOld,
            cleanupDate: new Date().toISOString()
          });
        }

        return ApiResponses.badRequest('Acción no válida. Use action: "cleanup"');

      } catch (error) {
        console.error('Error en limpieza:', error);
        return ApiResponses.internalError('Error durante la limpieza');
      }
    }
  )
);