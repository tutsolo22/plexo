'use client';

import { StatsCards } from './components/StatsCards';
import { QuickActions } from './components/QuickActions';
import { RecentActivity } from './components/RecentActivity';
import { LazyAnalyticsDashboard, preloadCriticalComponents } from '@/lib/lazy-components';
import { AIAgent } from '@/components/ai-agent';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [isAIMinimized, setIsAIMinimized] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Precargar componentes críticos
  useEffect(() => {
    preloadCriticalComponents();
    setMounted(true);
  }, []);

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
          <p className='mt-2 text-gray-600'>
            Bienvenido al sistema de gestión de eventos - Vista general del negocio
          </p>
        </div>

        {/* Toggle para Analytics Avanzados */}
        <button
          onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
          className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
        >
          {showAdvancedAnalytics ? 'Vista Simple' : 'Analytics Avanzados'}
        </button>
      </div>

      {/* Stats Cards - Siempre visible, carga rápida */}
      <StatsCards period={30} />

      {/* Conditional Advanced Analytics */}
      {showAdvancedAnalytics && (
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <h2 className='mb-4 text-xl font-semibold'>📊 Analytics Avanzados</h2>
          <LazyAnalyticsDashboard />
        </div>
      )}

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {/* Quick Actions - 1 column */}
        <div>
          <QuickActions />
        </div>

        {/* Recent Activity - 2 columns */}
        <div className='lg:col-span-2'>
          <RecentActivity limit={8} type='all' />
        </div>
      </div>

      {/* AI Agent - Solo renderizar cuando esté montado */}
      {mounted && (
        <AIAgent
          isMinimized={isAIMinimized}
          onToggleMinimize={() => setIsAIMinimized(!isAIMinimized)}
        />
      )}
    </div>
  );
}
