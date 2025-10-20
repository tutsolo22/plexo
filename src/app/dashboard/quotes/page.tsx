'use client';

import React, { useState } from 'react';
import QuoteList from '@/components/quotes/QuoteList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState('all');

  const handleQuoteSelect = (quote: any) => {
    // Aquí podrías abrir un modal o navegar a la página de detalle
    console.log('Selected quote:', quote);
  };

  const quickStats = [
    {
      title: 'Total Cotizaciones',
      value: '24',
      change: '+12%',
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Pendientes Aprobación',
      value: '8',
      change: '+3',
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Enviadas este mes',
      value: '15',
      change: '+25%',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Valor Total',
      value: 'Q125,450',
      change: '+18%',
      icon: DollarSign,
      color: 'bg-purple-500',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Cotización Q-202410-0045 enviada',
      user: 'María García',
      time: 'Hace 5 minutos',
      type: 'sent',
    },
    {
      id: 2,
      action: 'Nueva cotización Q-202410-0046 creada',
      user: 'Carlos López',
      time: 'Hace 12 minutos',
      type: 'created',
    },
    {
      id: 3,
      action: 'Cotización Q-202410-0044 aprobada',
      user: 'Ana Martín',
      time: 'Hace 1 hora',
      type: 'approved',
    },
    {
      id: 4,
      action: 'Cliente respondió a Q-202410-0043',
      user: 'Sistema',
      time: 'Hace 2 horas',
      type: 'response',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'created':
        return <Plus className='h-4 w-4 text-blue-600' />;
      case 'approved':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'response':
        return <AlertCircle className='h-4 w-4 text-orange-600' />;
      default:
        return <FileText className='h-4 w-4 text-gray-600' />;
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='mb-6 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-blue-600 p-3'>
                <FileText className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Cotizaciones</h1>
                <p className='text-gray-600'>Gestiona y envía cotizaciones profesionales</p>
              </div>
            </div>
            <Button size='lg'>
              <Plus className='mr-2 h-5 w-5' />
              Nueva Cotización
            </Button>
          </div>

          {/* Quick Stats */}
          <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>{stat.title}</p>
                      <p className='text-2xl font-bold text-gray-900'>{stat.value}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${stat.color}`}>
                      <stat.icon className='h-6 w-6 text-white' />
                    </div>
                  </div>
                  <div className='mt-4 flex items-center'>
                    <TrendingUp className='mr-1 h-4 w-4 text-green-500' />
                    <span className='text-sm font-medium text-green-500'>{stat.change}</span>
                    <span className='ml-1 text-sm text-gray-600'>vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          {/* Cotizaciones List */}
          <div className='lg:col-span-3'>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
              <TabsList className='grid w-full grid-cols-5'>
                <TabsTrigger value='all'>Todas</TabsTrigger>
                <TabsTrigger value='draft'>Borradores</TabsTrigger>
                <TabsTrigger value='pending'>Pendientes</TabsTrigger>
                <TabsTrigger value='sent'>Enviadas</TabsTrigger>
                <TabsTrigger value='accepted'>Aceptadas</TabsTrigger>
              </TabsList>

              <TabsContent value='all'>
                <QuoteList onQuoteSelect={handleQuoteSelect} showActions={true} />
              </TabsContent>

              <TabsContent value='draft'>
                <QuoteList
                  initialFilters={{ status: 'DRAFT' }}
                  onQuoteSelect={handleQuoteSelect}
                  showActions={true}
                />
              </TabsContent>

              <TabsContent value='pending'>
                <QuoteList
                  initialFilters={{ status: 'PENDING_MANAGER' }}
                  onQuoteSelect={handleQuoteSelect}
                  showActions={true}
                />
              </TabsContent>

              <TabsContent value='sent'>
                <QuoteList
                  initialFilters={{ status: 'SENT_TO_CLIENT' }}
                  onQuoteSelect={handleQuoteSelect}
                  showActions={true}
                />
              </TabsContent>

              <TabsContent value='accepted'>
                <QuoteList
                  initialFilters={{ status: 'ACCEPTED_BY_CLIENT' }}
                  onQuoteSelect={handleQuoteSelect}
                  showActions={true}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button className='w-full justify-start' variant='outline'>
                  <Plus className='mr-2 h-4 w-4' />
                  Nueva Cotización
                </Button>
                <Button className='w-full justify-start' variant='outline'>
                  <FileText className='mr-2 h-4 w-4' />
                  Desde Template
                </Button>
                <Button className='w-full justify-start' variant='outline'>
                  <Calendar className='mr-2 h-4 w-4' />
                  Desde Evento
                </Button>
                <Button className='w-full justify-start' variant='outline'>
                  <BarChart3 className='mr-2 h-4 w-4' />
                  Ver Reportes
                </Button>
              </CardContent>
            </Card>

            {/* Templates Populares */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Templates Populares</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Boda Elegante</span>
                    <Badge variant='secondary'>12 usos</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Evento Corporativo</span>
                    <Badge variant='secondary'>8 usos</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Quinceañera</span>
                    <Badge variant='secondary'>6 usos</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Graduación</span>
                    <Badge variant='secondary'>4 usos</Badge>
                  </div>
                </div>
                <Button className='w-full' variant='outline' size='sm'>
                  Ver Todos los Templates
                </Button>
              </CardContent>
            </Card>

            {/* Actividad Reciente */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentActivity.map(activity => (
                    <div key={activity.id} className='flex items-start gap-3'>
                      <div className='mt-0.5'>{getActivityIcon(activity.type)}</div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-gray-900'>
                          {activity.action}
                        </p>
                        <p className='text-xs text-gray-600'>
                          por {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className='mt-4 w-full' variant='outline' size='sm'>
                  Ver Toda la Actividad
                </Button>
              </CardContent>
            </Card>

            {/* Próximos Vencimientos */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <AlertCircle className='h-5 w-5 text-orange-500' />
                  Próximos Vencimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='rounded-lg border border-orange-200 bg-orange-50 p-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>Q-202410-0041</span>
                      <Badge variant='outline' className='border-orange-600 text-orange-600'>
                        2 días
                      </Badge>
                    </div>
                    <p className='mt-1 text-xs text-gray-600'>Boda María & Carlos</p>
                  </div>
                  <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>Q-202410-0039</span>
                      <Badge variant='outline' className='border-red-600 text-red-600'>
                        Mañana
                      </Badge>
                    </div>
                    <p className='mt-1 text-xs text-gray-600'>Evento Corporativo TechCorp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
