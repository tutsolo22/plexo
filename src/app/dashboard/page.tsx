'use client'

import { StatsCards } from './components/StatsCards'
import { RevenueChart } from './components/RevenueChart'
import { QuickActions } from './components/QuickActions'
import { RecentActivity } from './components/RecentActivity'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido al sistema de gestión de eventos - Vista general del negocio
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards period={30} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart - 2 columns */}
        <div className="lg:col-span-2">
          <RevenueChart period={30} granularity="daily" />
        </div>
        
        {/* Quick Actions - 1 column */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity - Full width */}
      <RecentActivity limit={8} type="all" />
    </div>
  )
}
