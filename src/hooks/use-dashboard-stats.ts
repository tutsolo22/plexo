'use client';

import { useEffect, useState } from 'react'

export interface DashboardStats {
  totalClients: number
  totalEvents: number
  totalQuotes: number
  totalVenues: number
  recentEvents: Array<{
    id: string
    title: string
    startDate: string
    client: { name: string }
    venue: { name: string } | null
  }>
  recentQuotes: Array<{
    id: string
    number: string
    total: number
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

