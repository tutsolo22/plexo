'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventsCalendar } from '../components/EventsCalendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar, 
  Plus, 
  List,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  User,
  MapPin,
  Clock,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Event {
  id: string
  title: string
  startDate: string
  endDate: string
  status: 'RESERVED' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED'
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  room?: {
    id: string
    name: string
    capacity: number
  }
  venue?: {
    id: string
    name: string
    address: string
  }
  quote?: {
    id: string
    quoteNumber: string
    status: string
    total: number
  }
}

export default function EventsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })

      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/events?${params}`)
      const data = await response.json()

      if (data.success) {
        setEvents(data.data.events)
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages)
        }
      } else {
        setError(data.error || 'Error al cargar eventos')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'list') {
      loadEvents()
    }
  }, [viewMode, page, searchTerm, statusFilter])

  const handleEventClick = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`)
  }

  const handleDateSelect = (start: Date, end: Date) => {
    const startISO = start.toISOString().slice(0, 16)
    const endISO = end.toISOString().slice(0, 16)
    router.push(`/dashboard/events/new?start=${startISO}&end=${endISO}`)
  }

  const handleCreateEvent = () => {
    router.push('/dashboard/events/new')
  }

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

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        loadEvents() // Recargar la lista
      } else {
        alert(data.error || 'Error al eliminar el evento')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Eventos</h1>
          <p className="text-muted-foreground">
            Administra y organiza todos los eventos de tu venue
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-md"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-md"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>

          <Button onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>
      </div>

      {/* Vista de Calendario */}
      {viewMode === 'calendar' && (
        <EventsCalendar
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
          onEventCreate={handleCreateEvent}
        />
      )}

      {/* Vista de Lista */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>Lista de Eventos</CardTitle>
                <CardDescription>
                  Vista detallada de todos los eventos registrados
                </CardDescription>
              </div>

              {/* Filtros para vista de lista */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-2 text-muted-foreground">Cargando eventos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <Button onClick={loadEvents} variant="outline" className="mt-2">
                  Reintentar
                </Button>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No hay eventos registrados</p>
                <p className="text-muted-foreground mb-4">
                  Comienza creando tu primer evento
                </p>
                <Button onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Evento
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.quote && `Cotización: ${event.quote.quoteNumber}`}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {event.client.firstName} {event.client.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {event.client.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {new Date(event.startDate).toLocaleDateString('es-CL')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.startDate).toLocaleTimeString('es-CL', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} - 
                                {new Date(event.endDate).toLocaleTimeString('es-CL', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {event.room?.name || event.venue?.name || 'Sin ubicación'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(event.status)}
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEventClick(event.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}