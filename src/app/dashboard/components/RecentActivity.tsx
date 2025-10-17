'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Activity, 
  Calendar, 
  Users, 
  FileText, 
  DollarSign,
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/chart-utils'

interface ActivityItem {
  id: string
  type: 'event' | 'client' | 'quote' | 'payment'
  action: string
  title: string
  description: string
  timestamp: string
  relatedEntity?: {
    id: string
    name: string
    type: string
  }
}

interface ActivityData {
  activities: ActivityItem[]
  summary: {
    total: number
    limit: number
    type: string
  }
}

interface RecentActivityProps {
  limit?: number
  type?: 'all' | 'events' | 'clients' | 'quotes' | 'payments'
  className?: string
}

export function RecentActivity({ 
  limit = 10, 
  type = 'all', 
  className = '' 
}: RecentActivityProps) {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivity()
  }, [limit, type])

  const fetchActivity = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/activity?limit=${limit}&type=${type}`)
      if (!response.ok) {
        throw new Error('Error al obtener actividad reciente')
      }
      
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.message || 'Error al obtener actividad')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error fetching activity:', err)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string, action: string) => {
    switch (type) {
      case 'event':
        return Calendar
      case 'client':
        return Users
      case 'quote':
        return FileText
      case 'payment':
        return DollarSign
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string, action: string) => {
    switch (type) {
      case 'event':
        return 'text-blue-600 bg-blue-50'
      case 'client':
        return 'text-emerald-600 bg-emerald-50'
      case 'quote':
        return action === 'approved' 
          ? 'text-green-600 bg-green-50' 
          : action === 'rejected' 
          ? 'text-red-600 bg-red-50'
          : 'text-violet-600 bg-violet-50'
      case 'payment':
        return action === 'completed' 
          ? 'text-green-600 bg-green-50'
          : action === 'failed'
          ? 'text-red-600 bg-red-50'
          : 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getActionBadge = (type: string, action: string) => {
    const badges: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      'created': { label: 'Creado', variant: 'secondary' },
      'approved': { label: 'Aprobado', variant: 'default' },
      'rejected': { label: 'Rechazado', variant: 'destructive' },
      'sent': { label: 'Enviado', variant: 'outline' },
      'completed': { label: 'Completado', variant: 'default' },
      'failed': { label: 'Fallido', variant: 'destructive' },
      'pending': { label: 'Pendiente', variant: 'outline' }
    }
    
    return badges[action] || { label: action, variant: 'outline' as const }
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Hace un momento'
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`
    
    return time.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric',
      year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
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
            <p className="font-medium">Error al cargar actividad</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
            <Button 
              onClick={fetchActivity}
              variant="outline" 
              size="sm"
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-500" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>No hay actividad reciente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontró actividad reciente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas {data.summary.total} actividades del sistema
            </CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivity}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {data.activities.map((activity) => {
            const Icon = getActivityIcon(activity.type, activity.action)
            const colors = getActivityColor(activity.type, activity.action)
            const badgeInfo = getActionBadge(activity.type, activity.action)
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                {/* Icon */}
                <div className={`p-2 rounded-full ${colors}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {activity.title}
                    </h4>
                    <Badge variant={badgeInfo.variant} className="text-xs">
                      {badgeInfo.label}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(activity.timestamp)}
                    </div>
                    
                    {activity.relatedEntity && (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {activity.relatedEntity.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">
                          {activity.relatedEntity.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action button */}
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
        
        {/* Ver más */}
        {data.activities.length === data.summary.limit && (
          <div className="pt-4 border-t mt-4">
            <Button variant="outline" className="w-full" size="sm">
              Ver más actividad
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}