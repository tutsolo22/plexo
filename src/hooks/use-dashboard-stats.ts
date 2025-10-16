import { useEffect, useState } from 'react'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface DashboardStats {
  totalClients: number
  totalEvents: number
  totalQuotes: number
  totalVenues: number
  recentEvents: Array<{
    id: string
    title: string
    startDate: Date
    client: { name: string }
    venue: { name: string } | null
  }>
  recentQuotes: Array<{
    id: string
    number: string
    total: Decimal
    client: { name: string }
    status: string
  }>
}

export interface DashboardStatsLoading {
  data: DashboardStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook personalizado para obtener estadísticas del dashboard
 * Implementa patrón DRY para reutilizar lógica de fetching
 */
export function useDashboardStats(): DashboardStatsLoading {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/stats')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const stats = await response.json()
      setData(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    data,
    loading,
    error,
    refresh: fetchStats,
  }
}

/**
 * Función server-side para obtener estadísticas
 * Reutilizable en páginas y API routes
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalClients,
    totalEvents,
    totalQuotes,
    totalVenues,
    recentEvents,
    recentQuotes
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
  ])

  return {
    totalClients,
    totalEvents,
    totalQuotes,
    totalVenues,
    recentEvents,
    recentQuotes
  }
}