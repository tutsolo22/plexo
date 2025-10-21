import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/widget/analytics - Obtener estadísticas del widget
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Estadísticas generales
    const totalConversations = await prisma.widgetConversation.count({
      where: {
        widgetApiKey: {
          tenantId
        }
      }
    });

    const activeConversations = await prisma.widgetConversation.count({
      where: {
        widgetApiKey: {
          tenantId
        },
        status: 'active',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    const totalMessages = await prisma.widgetMessage.count({
      where: {
        conversation: {
          widgetApiKey: {
            tenantId
          }
        }
      }
    });

    // Calcular tiempo de respuesta promedio (simulado por ahora)
    const averageResponseTime = 2.5; // segundos

    // Preguntas más frecuentes (basado en mensajes de usuario)
    const topQuestions = await prisma.widgetMessage.groupBy({
      by: ['content'],
      where: {
        conversation: {
          widgetApiKey: {
            tenantId
          }
        },
        direction: 'inbound'
      },
      _count: {
        content: true
      },
      orderBy: {
        _count: {
          content: 'desc'
        }
      },
      take: 10
    });

    const formattedTopQuestions = topQuestions.map(item => ({
      question: item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content,
      count: item._count.content
    }));

    // Uso por día (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const usageByDay = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(DISTINCT wc.id) as conversations,
        COUNT(wm.id) as messages
      FROM widget_conversations wc
      LEFT JOIN widget_messages wm ON wc.id = wm.conversation_id
      WHERE wc.tenant_id = ${tenantId}
        AND wc.created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
    `;

    const stats = {
      totalConversations,
      activeConversations,
      totalMessages,
      averageResponseTime,
      topQuestions: formattedTopQuestions,
      usageByDay: usageByDay as Array<{
        date: string;
        conversations: number;
        messages: number;
      }>
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching widget analytics:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}