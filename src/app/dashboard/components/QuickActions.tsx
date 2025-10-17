'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign,
  Clock,
  Search,
  Zap,
  ArrowRight,
  LucideIcon
} from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
  bgColor: string
  badge?: string
  shortcut?: string
}

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className = '' }: QuickActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const quickActions: QuickAction[] = [
    {
      id: 'new-event',
      title: 'Crear Evento',
      description: 'Nuevo evento rápido',
      icon: Calendar,
      href: '/dashboard/events/new',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: 'Rápido',
      shortcut: 'Ctrl+E'
    },
    {
      id: 'new-client',
      title: 'Registrar Cliente',
      description: 'Nuevo cliente en el sistema',
      icon: Users,
      href: '/dashboard/clients/new',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      shortcut: 'Ctrl+C'
    },
    {
      id: 'new-quote',
      title: 'Nueva Cotización',
      description: 'Crear cotización',
      icon: FileText,
      href: '/dashboard/quotes/new',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      badge: 'Popular',
      shortcut: 'Ctrl+Q'
    },
    {
      id: 'view-payments',
      title: 'Ver Pagos',
      description: 'Pagos pendientes',
      icon: DollarSign,
      href: '/dashboard/payments',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'today-events',
      title: 'Eventos de Hoy',
      description: 'Agenda del día',
      icon: Clock,
      href: '/dashboard/calendar?view=today',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badge: 'Hoy'
    },
    {
      id: 'search',
      title: 'Búsqueda Global',
      description: 'Buscar en todo el sistema',
      icon: Search,
      href: '/dashboard/search',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      shortcut: 'Ctrl+K'
    }
  ]

  const handleAction = async (action: QuickAction) => {
    setIsLoading(action.id)
    
    try {
      // Simular tiempo de carga para mejor UX
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push(action.href)
    } catch (error) {
      console.error('Error navigating to:', action.href, error)
      setIsLoading(null)
    }
  }

  // Acciones destacadas (primeras 3)
  const featuredActions = quickActions.slice(0, 3)
  const otherActions = quickActions.slice(3)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Acciones Rápidas
        </CardTitle>
        <CardDescription>
          Shortcuts para las tareas más comunes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Acciones Destacadas */}
        <div className="grid grid-cols-1 gap-3">
          {featuredActions.map((action) => {
            const Icon = action.icon
            const loading = isLoading === action.id
            
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 justify-start hover:shadow-md transition-all"
                onClick={() => handleAction(action)}
                disabled={loading}
              >
                <div className="flex items-center w-full">
                  <div className={`p-2 rounded-lg ${action.bgColor} mr-3`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {action.title}
                      </span>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {action.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {action.shortcut && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {action.shortcut}
                      </Badge>
                    )}
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                    ) : (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Otras Acciones - Grid compacto */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Más Acciones</h4>
          <div className="grid grid-cols-2 gap-2">
            {otherActions.map((action) => {
              const Icon = action.icon
              const loading = isLoading === action.id
              
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-3 justify-start"
                  onClick={() => handleAction(action)}
                  disabled={loading}
                >
                  <div className="flex items-center w-full">
                    <div className={`p-1.5 rounded ${action.bgColor} mr-2`}>
                      <Icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {action.title}
                      </p>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    {loading && (
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-blue-600"></div>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
        
        {/* Tip de shortcuts */}
        <div className="pt-4 border-t">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded">
                <Zap className="h-3 w-3 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700">
                <span className="font-medium">Tip:</span> Usa los atajos de teclado para acceso rápido
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}