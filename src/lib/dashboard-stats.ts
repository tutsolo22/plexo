import { prisma } from '@/lib/prisma';

export interface DashboardStats {
  totalClients: number;
  totalEvents: number;
  totalQuotes: number;
  totalVenues: number;
  recentEvents: Array<{
    id: string;
    title: string;
    startDate: Date;
    client: { name: string };
    venue: { name: string } | null;
  }>;
  recentQuotes: Array<{
    id: string;
    number: string;
    total: number;
    client: { name: string };
    status: string;
  }>;
}

/**
 * Función server-side para obtener estadísticas del dashboard
 * Reutilizable en páginas y API routes
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalClients,
    totalEvents,
    totalQuotes,
    totalVenues,
    recentEventsData,
    recentQuotesData
  ] = await Promise.all([
    prisma.client.count(),
    prisma.event.count(),
    prisma.quote.count(),
    prisma.venue.count(),
    prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { 
        client: { select: { name: true } }, 
        venue: { select: { name: true } } 
      }
    }),
    prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { 
        client: { select: { name: true } } 
      }
    })
  ]);

  return {
    totalClients,
    totalEvents,
    totalQuotes,
    totalVenues,
    recentEvents: recentEventsData.map(event => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      client: event.client,
      venue: event.venue
    })),
    recentQuotes: recentQuotesData.map(quote => ({
      id: quote.id,
      number: quote.quoteNumber,
      total: Number(quote.total),
      client: quote.client,
      status: quote.status
    }))
  };
}