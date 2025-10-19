'use client'

import { StatsCards } from './components/StatsCards'
import { QuickActions } from './components/QuickActions'
import { RecentActivity } from './components/RecentActivity'
import { LazyAnalyticsDashboard, LazyNotificationSystem, preloadCriticalComponents } from '@/lib/lazy-components'
import { AIAgent } from '@/components/ai-agent'
import { useEffect, useState } from 'react'

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido al sistema de gestión de eventos - Vista general del negocio
          </p>
        </div>
        
        {/* Toggle para Analytics Avanzados */}
        <button
          onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAdvancedAnalytics ? 'Vista Simple' : 'Analytics Avanzados'}
        </button>
      </div>

      {/* Stats Cards - Siempre visible, carga rápida */}
      <StatsCards period={30} />

      {/* Conditional Advanced Analytics */}
      {showAdvancedAnalytics && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">📊 Analytics Avanzados</h2>
          <LazyAnalyticsDashboard />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions - 1 column */}
        <div>
          <QuickActions />
        </div>
        
        {/* Recent Activity - 2 columns */}
        <div className="lg:col-span-2">
          <RecentActivity limit={8} type="all" />
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
  )
}
