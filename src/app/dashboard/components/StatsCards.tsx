'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/chart-utils'

interface StatsData {
  totalEvents: number
  totalClients: number
  activeClients: number
  newClientsThisPeriod: number
  eventsThisPeriod: number
  completedEvents: number
  totalQuotes: number
  pendingQuotes: number
  conversionRate: number
  monthlyRevenue: number
  period: {
    startDate: string
    endDate: string
    days: number
  }
}

interface StatsCardsProps {
  period?: number
  className?: string
}

export function StatsCards({ period = 30, className = '' }: StatsCardsProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/dashboard/stats?period=${period}`)
        if (!response.ok) {
          throw new Error('Error al obtener estadísticas')
        }
        
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        } else {
          throw new Error(data.message || 'Error al obtener estadísticas')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [period])

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-red-600 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Error al cargar estadísticas</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const statsConfig = [
    {
      title: 'Total Eventos',
      value: stats.totalEvents,
      description: `${stats.eventsThisPeriod} en últimos ${stats.period.days} días`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null
    },
    {
      title: 'Total Clientes',
      value: stats.totalClients,
      description: `${stats.newClientsThisPeriod} nuevos este período`,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: stats.newClientsThisPeriod > 0 ? 'up' : null
    },
    {
      title: 'Clientes Activos',
      value: stats.activeClients,
      description: `${formatPercentage((stats.activeClients / stats.totalClients) * 100, 0)} del total`,
      icon: Activity,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      change: null
    },
    {
      title: 'Revenue Mensual',
      value: formatCurrency(stats.monthlyRevenue),
      description: 'Ingresos del mes actual',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: stats.monthlyRevenue > 0 ? 'up' : null,
      isMonetary: true
    },
    {
      title: 'Cotizaciones',
      value: stats.totalQuotes,
      description: `${stats.pendingQuotes} pendientes`,
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: null
    },
    {
      title: 'Tasa Conversión',
      value: `${stats.conversionRate}%`,
      description: 'Cotizaciones aprobadas',
      icon: TrendingUp,
      color: stats.conversionRate >= 50 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.conversionRate >= 50 ? 'bg-green-50' : 'bg-red-50',
      change: stats.conversionRate >= 50 ? 'up' : 'down',
      isPercentage: true
    },
    {
      title: 'Eventos Completados',
      value: stats.completedEvents,
      description: `${formatPercentage((stats.completedEvents / stats.totalEvents) * 100, 0)} del total`,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: null
    },
    {
      title: 'Cotizaciones Pendientes',
      value: stats.pendingQuotes,
      description: 'Requieren atención',
      icon: FileText,
      color: stats.pendingQuotes > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: stats.pendingQuotes > 0 ? 'bg-orange-50' : 'bg-gray-50',
      change: stats.pendingQuotes > 0 ? 'attention' : null
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.isMonetary ? stat.value : formatNumber(typeof stat.value === 'string' ? parseInt(stat.value) : stat.value)}
                  </div>
                  <CardDescription className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </CardDescription>
                </div>
                
                {stat.change && (
                  <div className="flex items-center">
                    {stat.change === 'up' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        ↑
                      </Badge>
                    )}
                    {stat.change === 'down' && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        ↓
                      </Badge>
                    )}
                    {stat.change === 'attention' && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        <Clock className="h-3 w-3 mr-1" />
                        !
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}