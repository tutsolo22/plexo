'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react'
import { 
  formatCurrency, 
  formatPercentage, 
  CHART_COLORS, 
  CHART_CONFIG,
  REVENUE_TOOLTIP_CONFIG
} from '@/lib/chart-utils'

interface RevenueData {
  revenueData: Array<{
    date: string
    revenue: number
    events: number
  }>
  summary: {
    totalRevenue: number
    averageEventValue: number
    totalEvents: number
    revenueGrowth: number
    period: {
      startDate: string
      endDate: string
      days: number
      granularity: string
    }
  }
  topEvents: Array<{
    id: string
    name: string
    date: string
    revenue: number
    client: string
    status: string
  }>
}

interface RevenueChartProps {
  period?: number
  granularity?: 'daily' | 'weekly' | 'monthly'
  className?: string
}

export function RevenueChart({ 
  period = 30, 
  granularity = 'daily', 
  className = '' 
}: RevenueChartProps) {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  const [selectedGranularity, setSelectedGranularity] = useState(granularity)

  useEffect(() => {
    fetchRevenueData()
  }, [period, selectedGranularity])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/dashboard/revenue?period=${period}&granularity=${selectedGranularity}`
      )
      
      if (!response.ok) {
        throw new Error('Error al obtener datos de revenue')
      }
      
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.message || 'Error al obtener datos de revenue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error fetching revenue data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDateForChart = (dateStr: string) => {
    try {
      if (selectedGranularity === 'daily') {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  const chartData = data?.revenueData.map(item => ({
    ...item,
    date: formatDateForChart(item.date),
    formattedRevenue: formatCurrency(item.revenue)
  })) || []

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Error al cargar datos de revenue</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
            <Button 
              onClick={fetchRevenueData}
              variant="outline" 
              size="sm"
              className="mt-3"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Overview
            </CardTitle>
            <CardDescription>
              {formatCurrency(data.summary.totalRevenue)} en {data.summary.totalEvents} eventos
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Selector de granularidad */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['daily', 'weekly', 'monthly'] as const).map((gran) => (
                <Button
                  key={gran}
                  variant={selectedGranularity === gran ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setSelectedGranularity(gran)}
                >
                  {gran === 'daily' && 'Diario'}
                  {gran === 'weekly' && 'Semanal'}
                  {gran === 'monthly' && 'Mensual'}
                </Button>
              ))}
            </div>
            
            {/* Selector de tipo de gráfico */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChartType(chartType === 'area' ? 'bar' : 'area')}
            >
              {chartType === 'area' ? <BarChart3 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Métricas resumen */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${
                data.summary.revenueGrowth >= 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {data.summary.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(Math.abs(data.summary.revenueGrowth))}
            </Badge>
            <span className="text-sm text-gray-600">vs período anterior</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            Promedio: {formatCurrency(data.summary.averageEventValue)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} {...CHART_CONFIG}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_CONFIG.grid} />
                <XAxis 
                  dataKey="date" 
                  {...CHART_CONFIG.axis}
                  angle={selectedGranularity === 'daily' ? -45 : 0}
                  textAnchor={selectedGranularity === 'daily' ? 'end' : 'middle'}
                  height={selectedGranularity === 'daily' ? 60 : 30}
                />
                <YAxis {...CHART_CONFIG.axis} tickFormatter={formatCurrency} />
                <Tooltip 
                  {...REVENUE_TOOLTIP_CONFIG}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue']
                    if (name === 'events') return [value, 'Eventos']
                    return [value, name]
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.success}
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} {...CHART_CONFIG}>
                <CartesianGrid {...CHART_CONFIG.grid} />
                <XAxis 
                  dataKey="date" 
                  {...CHART_CONFIG.axis}
                  angle={selectedGranularity === 'daily' ? -45 : 0}
                  textAnchor={selectedGranularity === 'daily' ? 'end' : 'middle'}
                  height={selectedGranularity === 'daily' ? 60 : 30}
                />
                <YAxis {...CHART_CONFIG.axis} tickFormatter={formatCurrency} />
                <Tooltip 
                  {...REVENUE_TOOLTIP_CONFIG}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue']
                    if (name === 'events') return [value, 'Eventos']
                    return [value, name]
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill={CHART_COLORS.success} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Top eventos */}
        {data.topEvents.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">Top Eventos por Revenue</h4>
            <div className="space-y-2">
              {data.topEvents.slice(0, 3).map((event, index) => (
                <div key={event.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{event.name}</p>
                      <p className="text-xs text-gray-500">{event.client}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-green-600">
                      {formatCurrency(event.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}