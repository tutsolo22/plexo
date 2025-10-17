// Sistema de notificaciones en tiempo real usando Server-Sent Events
// /api/notifications/stream/route.ts

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Configurar Server-Sent Events
  const encoder = new TextEncoder();
  
  const customReadable = new ReadableStream({
    start(controller) {
      // Función para enviar datos
      const sendData = (data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Enviar mensaje inicial de conexión
      sendData({
        type: 'connected',
        message: 'Conectado al sistema de notificaciones',
        timestamp: new Date().toISOString(),
        userId: session.user.id
      });

      // Configurar interval para verificar nuevas notificaciones
      const interval = setInterval(async () => {
        try {
          // Verificar nuevas cotizaciones (últimos 5 minutos)
          const recentQuotes = await prisma.quote.findMany({
            where: {
              tenantId: session.user.tenantId,
              createdAt: {
                gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
              }
            },
            include: {
              client: { select: { name: true } },
              event: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          });

          // Enviar notificaciones de cotizaciones nuevas
          recentQuotes.forEach(quote => {
            sendData({
              type: 'new_quote',
              title: 'Nueva Cotización Creada',
              message: `Cotización ${quote.quoteNumber} para ${quote.client?.name}`,
              data: {
                quoteId: quote.id,
                quoteNumber: quote.quoteNumber,
                clientName: quote.client?.name,
                eventTitle: quote.event?.title,
                amount: quote.totalAmount
              },
              timestamp: quote.createdAt,
              priority: 'normal'
            });
          });

          // Verificar eventos próximos (próximas 24 horas)
          const upcomingEvents = await prisma.event.findMany({
            where: {
              tenantId: session.user.tenantId,
              startDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Próximas 24 horas
              }
            },
            include: {
              client: { select: { name: true } }
            },
            orderBy: { startDate: 'asc' },
            take: 3
          });

          // Enviar notificaciones de eventos próximos
          upcomingEvents.forEach(event => {
            const hoursUntil = Math.round((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60));
            
            if (hoursUntil <= 24 && hoursUntil > 0) {
              sendData({
                type: 'upcoming_event',
                title: 'Evento Próximo',
                message: `"${event.title}" comienza en ${hoursUntil} horas`,
                data: {
                  eventId: event.id,
                  title: event.title,
                  clientName: event.client?.name,
                  startDate: event.startDate,
                  hoursUntil
                },
                timestamp: new Date().toISOString(),
                priority: hoursUntil <= 2 ? 'high' : 'normal'
              });
            }
          });

          // Verificar emails abiertos recientemente (si EmailLog existe)
          try {
            const recentEmailOpens = await prisma.emailLog.findMany({
              where: {
                tenantId: session.user.tenantId,
                status: 'OPENED',
                updatedAt: {
                  gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
                }
              },
              include: {
                quote: {
                  include: {
                    client: { select: { name: true } }
                  }
                }
              },
              orderBy: { updatedAt: 'desc' },
              take: 5
            });

            // Enviar notificaciones de emails abiertos
            recentEmailOpens.forEach(emailLog => {
              sendData({
                type: 'email_opened',
                title: 'Email Abierto',
                message: `${emailLog.quote?.client?.name} abrió la cotización ${emailLog.quote?.quoteNumber}`,
                data: {
                  emailId: emailLog.id,
                  quoteId: emailLog.quoteId,
                  quoteNumber: emailLog.quote?.quoteNumber,
                  clientName: emailLog.quote?.client?.name,
                  openedAt: emailLog.updatedAt
                },
                timestamp: emailLog.updatedAt,
                priority: 'normal'
              });
            });
          } catch (error) {
            // EmailLog tabla puede no existir aún
          }

          // Enviar heartbeat cada minuto
          sendData({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Error en notifications stream:', error);
          sendData({
            type: 'error',
            message: 'Error al obtener notificaciones',
            timestamp: new Date().toISOString()
          });
        }
      }, 30000); // Verificar cada 30 segundos

      // Cleanup cuando se cierra la conexión
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}