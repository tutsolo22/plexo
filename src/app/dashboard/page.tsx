import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardStats } from "@/lib/dashboard-stats"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }

  const stats = await getDashboardStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Bienvenido, {session.user?.name || session.user?.email}</p>
            </div>
            <div className="text-sm text-gray-500">
              Rol: <span className="font-medium text-gray-700">{session.user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid - Componente DRY reutilizable */}
        <StatsGrid stats={stats} />

        {/* Recent Activity - Componente DRY reutilizable */}
        <RecentActivity events={stats.recentEvents} quotes={stats.recentQuotes} />
      </div>
    </div>
  )
}