'use client'

import React, { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarDays, 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  Plus,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Tipos para los eventos del calendario
interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    status: 'RESERVED' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED'
    clientName: string
    roomName?: string
    venueName?: string
    notes?: string
  }
}

interface EventsCalendarProps {
  className?: string
  onEventClick?: (eventId: string) => void
  onDateSelect?: (start: Date, end: Date) => void
  onEventCreate?: () => void
}

export function EventsCalendar({ 
  className = '', 
  onEventClick,
  onDateSelect,
  onEventCreate 
}: EventsCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Colores por estado
  const statusColors = {
    RESERVED: { bg: '#f59e0b', border: '#d97706' },
    QUOTED: { bg: '#3b82f6', border: '#2563eb' },
    CONFIRMED: { bg: '#10b981', border: '#059669' },
    CANCELLED: { bg: '#ef4444', border: '#dc2626' }
  }

  // Cargar eventos desde la API
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        calendar: 'true',
        limit: '1000'
      })

      if (filterStatus && filterStatus !== 'all') {
        params.set('status', filterStatus)
      }

      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const response = await fetch(`/api/events?${params}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar eventos')
      }

      const data = await response.json()

      if (data.success) {
        const calendarEvents: CalendarEvent[] = data.data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.startDate,
          end: event.endDate,
          backgroundColor: event.colorCode || statusColors[event.status as keyof typeof statusColors].bg,
          borderColor: statusColors[event.status as keyof typeof statusColors].border,
          extendedProps: {
            status: event.status,
            clientName: `${event.client?.firstName || ''} ${event.client?.lastName || ''}`.trim(),
            roomName: event.room?.name,
            venueName: event.venue?.name,
            notes: event.notes
          }
        }))
        setEvents(calendarEvents)
      } else {
        throw new Error(data.error || 'Error al cargar eventos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, searchTerm])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Manejar clic en evento
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      extendedProps: event.extendedProps
    })

    if (onEventClick) {
      onEventClick(event.id)
    }
  }

  // Manejar selección de fechas
  const handleDateSelect = (selectInfo: any) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end)
    }
  }

  // Obtener badge del estado
  const getStatusBadge = (status: string) => {
    const variants = {
      RESERVED: 'bg-yellow-100 text-yellow-800',
      QUOTED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }

    const labels = {
      RESERVED: 'Reservado',
      QUOTED: 'Cotizado',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado'
    }

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendario de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando calendario...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendario de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <CalendarDays className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Error al cargar el calendario</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
            <Button onClick={fetchEvents} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controles del calendario */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Calendario de Eventos
              </CardTitle>
              <CardDescription>
                Gestiona y visualiza todos los eventos programados
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {onEventCreate && (
                <Button onClick={onEventCreate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Evento
                </Button>
              )}
              <Button onClick={fetchEvents} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="RESERVED">Reservado</SelectItem>
                <SelectItem value="QUOTED">Cotizado</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calendario */}
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              select={handleDateSelect}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              height="auto"
              locale="es"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día'
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventContent={(eventInfo) => (
                <div className="p-1 truncate">
                  <div className="font-medium text-xs truncate">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-xs opacity-75 truncate">
                    {eventInfo.event.extendedProps['clientName'] || 'Sin cliente'}
                  </div>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Panel de detalles del evento seleccionado */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalles del Evento
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
              {getStatusBadge(selectedEvent.extendedProps.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedEvent.start).toLocaleString('es-CL')} - 
                    {new Date(selectedEvent.end).toLocaleString('es-CL')}
                  </span>
                </div>

                {selectedEvent.extendedProps.clientName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.extendedProps.clientName}</span>
                  </div>
                )}

                {(selectedEvent.extendedProps.roomName || selectedEvent.extendedProps.venueName) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedEvent.extendedProps.roomName || selectedEvent.extendedProps.venueName}
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.extendedProps.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Notas:</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.extendedProps.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={() => onEventClick?.(selectedEvent.id)}
              >
                Ver Detalles
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedEvent(null)}
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}