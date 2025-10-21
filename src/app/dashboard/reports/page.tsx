'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Users,
  DollarSign,
  FileText,
} from 'lucide-react';

interface ReportData {
  period: string;
  revenue: number;
  events: number;
  clients: number;
  growth: number;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const reportData: ReportData = {
    period: 'Octubre 2025',
    revenue: 125000,
    events: 18,
    clients: 45,
    growth: 12.5,
  };

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
    { month: 'Oct', revenue: 125000, events: 18 },
  ];

  const topClients = [
    { name: 'Corporativo ABC', revenue: 45000, events: 3 },
    { name: 'Eventos Sociales XYZ', revenue: 32000, events: 5 },
    { name: 'Hotel Grand Palace', revenue: 28000, events: 2 },
    { name: 'Empresa Tecnológica', revenue: 25000, events: 4 },
    { name: 'Organización Cultural', revenue: 18000, events: 6 },
  ];

  const eventTypes = [
    { type: 'Bodas', count: 8, revenue: 65000, percentage: 52 },
    { type: 'Corporativos', count: 6, revenue: 35000, percentage: 28 },
    { type: 'Cumpleaños', count: 3, revenue: 15000, percentage: 12 },
    { type: 'Otros', count: 1, revenue: 10000, percentage: 8 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const generateReport = (type: string) => {
    console.log(`Generando reporte de ${type}`);
    alert(`Generando reporte de ${type}...`);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Reportes y Análisis</h1>
          <p className='mt-2 text-gray-600 dark:text-gray-300'>
            Analiza el rendimiento de tu negocio con reportes detallados
          </p>
        </div>

        <div className='flex space-x-2'>
          <Button variant='outline' size='sm'>
            <Filter className='mr-2 h-4 w-4' />
            Filtros
          </Button>
          <Button className='bg-plexo-purple hover:bg-plexo-purple/90' size='sm'>
            <Download className='mr-2 h-4 w-4' />
            Exportar
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className='flex space-x-2'>
        {['week', 'month', 'quarter', 'year'].map(period => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedPeriod(period)}
            className={selectedPeriod === period ? 'bg-plexo-purple hover:bg-plexo-purple/90' : ''}
          >
            {period === 'week' && 'Semana'}
            {period === 'month' && 'Mes'}
            {period === 'quarter' && 'Trimestre'}
            {period === 'year' && 'Año'}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <DollarSign className='h-8 w-8 text-green-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>Ingresos</p>
                <p className='text-2xl font-bold'>{formatCurrency(reportData.revenue)}</p>
                <p className='mt-1 flex items-center text-xs text-green-600'>
                  <TrendingUp className='mr-1 h-3 w-3' />+{reportData.growth}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <Calendar className='h-8 w-8 text-blue-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>Eventos</p>
                <p className='text-2xl font-bold'>{reportData.events}</p>
                <p className='text-xs text-blue-600'>Este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <Users className='h-8 w-8 text-purple-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>Clientes</p>
                <p className='text-2xl font-bold'>{reportData.clients}</p>
                <p className='text-xs text-purple-600'>Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <DollarSign className='h-8 w-8 text-red-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>Costos Totales</p>
                <p className='text-2xl font-bold'>{formatCurrency(45000)}</p>
                <p className='text-xs text-red-600'>Este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <TrendingUp className='h-8 w-8 text-purple-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>Ganancia Neta</p>
                <p className='text-2xl font-bold'>{formatCurrency(795000)}</p>
                <p className='mt-1 flex items-center text-xs text-green-600'>
                  <TrendingUp className='mr-1 h-3 w-3' />+15.2%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Ingresos Mensuales */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Evolución de ingresos en los últimos 10 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {monthlyData.slice(-6).map((data, _index) => (
                <div key={data.month} className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='bg-plexo-purple h-3 w-3 rounded-full'></div>
                    <span className='font-medium'>{data.month}</span>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium'>{formatCurrency(data.revenue)}</p>
                    <p className='text-sm text-gray-500'>{data.events} eventos</p>
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
            <div className='space-y-4'>
              {topClients.map((client, index) => (
                <div key={client.name} className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800'>
                      <span className='text-sm font-medium'>{index + 1}</span>
                    </div>
                    <div>
                      <p className='font-medium'>{client.name}</p>
                      <p className='text-sm text-gray-500'>{client.events} eventos</p>
                    </div>
                  </div>
                  <p className='font-medium'>{formatCurrency(client.revenue)}</p>
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
            <div className='space-y-4'>
              {eventTypes.map(type => (
                <div key={type.type} className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>{type.type}</span>
                    <span className='text-sm text-gray-500'>
                      {type.count} eventos • {formatCurrency(type.revenue)}
                    </span>
                  </div>
                  <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                    <div
                      className='bg-plexo-purple h-2 rounded-full'
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Costos Operativos */}
        <Card>
          <CardHeader>
            <CardTitle>Costos Operativos</CardTitle>
            <CardDescription>Gastos operativos mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[
                { category: 'Alquiler', amount: 15000, percentage: 33 },
                { category: 'Servicios', amount: 12000, percentage: 27 },
                { category: 'Salarios', amount: 10000, percentage: 22 },
                { category: 'Marketing', amount: 5000, percentage: 11 },
                { category: 'Otros', amount: 3000, percentage: 7 }
              ].map(cost => (
                <div key={cost.category} className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='bg-red-100 dark:bg-red-900/20 h-3 w-3 rounded-full'></div>
                    <span className='font-medium'>{cost.category}</span>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium'>{formatCurrency(cost.amount)}</p>
                    <p className='text-sm text-gray-500'>{cost.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Proveedores */}
        <Card>
          <CardHeader>
            <CardTitle>Top Proveedores</CardTitle>
            <CardDescription>Proveedores por volumen de costos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[
                { name: 'Catering Elite', cost: 25000, events: 8 },
                { name: 'Decoraciones Premium', cost: 18000, events: 12 },
                { name: 'Música & Entretenimiento', cost: 15000, events: 6 },
                { name: 'Fotografía Profesional', cost: 12000, events: 10 },
                { name: 'Transporte VIP', cost: 8000, events: 5 }
              ].map(supplier => (
                <div key={supplier.name} className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
                      <span className='text-sm font-medium'>{supplier.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className='font-medium'>{supplier.name}</p>
                      <p className='text-sm text-gray-500'>{supplier.events} eventos</p>
                    </div>
                  </div>
                  <p className='font-medium'>{formatCurrency(supplier.cost)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rentabilidad */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Rentabilidad</CardTitle>
            <CardDescription>Márgenes de ganancia por tipo de evento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[
                { type: 'Bodas', revenue: 65000, costs: 28000, margin: 57 },
                { type: 'Corporativos', revenue: 35000, costs: 12000, margin: 66 },
                { type: 'Cumpleaños', revenue: 15000, costs: 6000, margin: 60 },
                { type: 'Otros', revenue: 10000, costs: 4000, margin: 60 }
              ].map(item => (
                <div key={item.type} className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>{item.type}</span>
                    <span className='text-sm text-gray-500'>
                      {formatCurrency(item.revenue)} - {formatCurrency(item.costs)}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{ width: `${item.margin}%` }}
                      ></div>
                    </div>
                    <span className='text-sm font-medium text-green-600'>{item.margin}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Reportes</CardTitle>
          <CardDescription>Exporta reportes detallados en diferentes formatos</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => generateReport('ventas')}
          >
            <FileText className='mr-2 h-4 w-4' />
            Reporte de Ventas
          </Button>
          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => generateReport('costos')}
          >
            <DollarSign className='mr-2 h-4 w-4' />
            Reporte de Costos
          </Button>
          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => generateReport('proveedores')}
          >
            <Users className='mr-2 h-4 w-4' />
            Reporte de Proveedores
          </Button>
          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => generateReport('rentabilidad')}
          >
            <TrendingUp className='mr-2 h-4 w-4' />
            Reporte de Rentabilidad
          </Button>
          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => generateReport('financiero')}
          >
            <BarChart3 className='mr-2 h-4 w-4' />
            Reporte Financiero Completo
          </Button>
        </CardContent>
      </Card>

      {/* Análisis de Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Tendencias</CardTitle>
          <CardDescription>Insights y recomendaciones basadas en tus datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='rounded-lg bg-green-50 p-4 dark:bg-green-900/20'>
              <div className='mb-2 flex items-center space-x-2'>
                <TrendingUp className='h-5 w-5 text-green-600' />
                <h4 className='font-medium text-green-800 dark:text-green-300'>
                  Crecimiento Positivo
                </h4>
              </div>
              <p className='text-sm text-green-700 dark:text-green-400'>
                Tus ingresos han crecido un 12.5% este mes comparado con el anterior.
              </p>
            </div>

            <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
              <div className='mb-2 flex items-center space-x-2'>
                <Calendar className='h-5 w-5 text-blue-600' />
                <h4 className='font-medium text-blue-800 dark:text-blue-300'>Temporada Alta</h4>
              </div>
              <p className='text-sm text-blue-700 dark:text-blue-400'>
                Octubre muestra un incremento en eventos corporativos del 25%.
              </p>
            </div>

            <div className='rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20'>
              <div className='mb-2 flex items-center space-x-2'>
                <Users className='h-5 w-5 text-purple-600' />
                <h4 className='font-medium text-purple-800 dark:text-purple-300'>
                  Clientes Recurrentes
                </h4>
              </div>
              <p className='text-sm text-purple-700 dark:text-purple-400'>
                El 68% de tus clientes han contratado más de un evento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
