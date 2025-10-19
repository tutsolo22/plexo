"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Users,
  DollarSign,
  ClipboardList,
  MapPin,
  Printer,
  FileText
} from "lucide-react"

interface ReportData {
  period: string
  revenue: number
  events: number
  clients: number
  growth: number
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  
  const reportData: ReportData = {
    period: 'Octubre 2025',
    revenue: 125000,
    events: 18,
    clients: 45,
    growth: 12.5
  }

  const monthlyData = [
    { month: 'Ene', revenue: 85000, events: 12 },
    { month: 'Feb', revenue: 92000, events: 14 },
    { month: 'Mar', revenue: 108000, events: 16 },
    { month: 'Abr', revenue: 95000, events: 13 },
    { month: 'May', revenue: 115000, events: 19 },
    { month: 'Jun', revenue: 128000, events: 21 },
    { month: 'Jul', revenue: 135000, events: 23 },
    { month: 'Ago', revenue: 118000, events: 17 },
    { month: 'Sep', revenue: 122000, events: 20 },
    { month: 'Oct', revenue: 125000, events: 18 }
  ]

  const topClients = [
    { name: 'Corporativo ABC', revenue: 45000, events: 3 },
    { name: 'Eventos Sociales XYZ', revenue: 32000, events: 5 },
    { name: 'Hotel Grand Palace', revenue: 28000, events: 2 },
    { name: 'Empresa Tecnológica', revenue: 25000, events: 4 },
    { name: 'Organización Cultural', revenue: 18000, events: 6 }
  ]

  const eventTypes = [
    { type: 'Bodas', count: 8, revenue: 65000, percentage: 52 },
    { type: 'Corporativos', count: 6, revenue: 35000, percentage: 28 },
    { type: 'Cumpleaños', count: 3, revenue: 15000, percentage: 12 },
    { type: 'Otros', count: 1, revenue: 10000, percentage: 8 }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const generateReport = (type: string) => {
    console.log(`Generando reporte de ${type}`)
    alert(`Generando reporte de ${type}...`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes y Análisis</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Analiza el rendimiento de tu negocio con reportes detallados
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-plexo-purple hover:bg-plexo-purple/90" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {['week', 'month', 'quarter', 'year'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
            className={selectedPeriod === period ? "bg-plexo-purple hover:bg-plexo-purple/90" : ""}
          >
            {period === 'week' && 'Semana'}
            {period === 'month' && 'Mes'}
            {period === 'quarter' && 'Trimestre'}
            {period === 'year' && 'Año'}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ingresos</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.revenue)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{reportData.growth}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Eventos</p>
                <p className="text-2xl font-bold">{reportData.events}</p>
                <p className="text-xs text-blue-600">Este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Clientes</p>
                <p className="text-2xl font-bold">{reportData.clients}</p>
                <p className="text-xs text-purple-600">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-plexo-volt" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Promedio/Evento</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.revenue / reportData.events)}</p>
                <p className="text-xs text-gray-500">Por evento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos Mensuales */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Evolución de ingresos en los últimos 10 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.slice(-6).map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-plexo-purple rounded-full"></div>
                    <span className="font-medium">{data.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(data.revenue)}</p>
                    <p className="text-sm text-gray-500">{data.events} eventos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Principales Clientes</CardTitle>
            <CardDescription>Clientes con mayor facturación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div key={client.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.events} eventos</p>
                    </div>
                  </div>
                  <p className="font-medium">{formatCurrency(client.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Evento</CardTitle>
            <CardDescription>Análisis de eventos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventTypes.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{type.type}</span>
                    <span className="text-sm text-gray-500">
                      {type.count} eventos • {formatCurrency(type.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-plexo-purple h-2 rounded-full" 
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reportes Disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Generar Reportes</CardTitle>
            <CardDescription>Exporta reportes detallados en diferentes formatos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('ventas')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Reporte de Ventas
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('clientes')}
            >
              <Users className="h-4 w-4 mr-2" />
              Reporte de Clientes
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('eventos')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reporte de Eventos
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('cotizaciones')}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Reporte de Cotizaciones
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => generateReport('financiero')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Reporte Financiero
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Tendencias</CardTitle>
          <CardDescription>Insights y recomendaciones basadas en tus datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-300">Crecimiento Positivo</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                Tus ingresos han crecido un 12.5% este mes comparado con el anterior.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800 dark:text-blue-300">Temporada Alta</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Octubre muestra un incremento en eventos corporativos del 25%.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-800 dark:text-purple-300">Clientes Recurrentes</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                El 68% de tus clientes han contratado más de un evento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}