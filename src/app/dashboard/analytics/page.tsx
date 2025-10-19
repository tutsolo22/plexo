'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  FileText,
  RefreshCw,
  Download
} from 'lucide-react'

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState({
    totalEvents: 45,
    totalClients: 28,
    totalRevenue: 325000,
    totalQuotes: 67,
    averageEventValue: 7222,
    growthRate: 12.5
  })

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const monthlyData = [
    { month: 'Ene', events: 8, revenue: 65000 },
    { month: 'Feb', events: 12, revenue: 89000 },
    { month: 'Mar', events: 10, revenue: 72000 },
    { month: 'Abr', events: 15, revenue: 105000 },
    { month: 'May', events: 18, revenue: 126000 },
    { month: 'Jun', events: 22, revenue: 154000 },
    { month: 'Jul', events: 25, revenue: 175000 },
    { month: 'Ago', events: 20, revenue: 140000 },
    { month: 'Sep', events: 28, revenue: 196000 },
    { month: 'Oct', events: 30, revenue: 210000 }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-plexo-purple" />
          <p className="text-gray-600 dark:text-gray-300">Cargando datos analíticos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics y Métricas</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Análisis detallado del rendimiento de tu negocio
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button className="bg-plexo-purple hover:bg-plexo-purple/90" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Eventos</p>
                <p className="text-2xl font-bold">{data.totalEvents}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% vs mes anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Clientes Activos</p>
                <p className="text-2xl font-bold">{data.totalClients}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% nuevos clientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-plexo-purple" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{data.growthRate}% crecimiento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cotizaciones</p>
                <p className="text-2xl font-bold">{data.totalQuotes}</p>
                <p className="text-xs text-orange-600">68% tasa conversión</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eventos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Mes</CardTitle>
            <CardDescription>Tendencia de eventos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.slice(-6).map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">{month.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{month.events} eventos</p>
                    <p className="text-sm text-gray-500">{formatCurrency(month.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Ingresos */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Rendimiento</CardTitle>
            <CardDescription>Métricas clave del negocio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Valor Promedio por Evento</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Último trimestre</p>
              </div>
              <p className="text-xl font-bold text-plexo-purple">
                {formatCurrency(data.averageEventValue)}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Tasa de Conversión</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Cotizaciones → Eventos</p>
              </div>
              <p className="text-xl font-bold text-green-600">68%</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Tiempo Promedio de Cierre</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Desde cotización</p>
              </div>
              <p className="text-xl font-bold text-blue-600">12 días</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Clientes Recurrentes</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Más de 1 evento</p>
              </div>
              <p className="text-xl font-bold text-purple-600">45%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights y Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Insights y Recomendaciones</CardTitle>
          <CardDescription>Análisis automático de tus datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-300">Tendencia Positiva</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                Tus ingresos mensuales han crecido consistentemente los últimos 6 meses.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800 dark:text-blue-300">Mejor Época</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Los meses de mayo a septiembre muestran el mayor volumen de eventos.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-800 dark:text-purple-300">Oportunidad</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Considera crear un programa de fidelidad para aumentar clientes recurrentes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}