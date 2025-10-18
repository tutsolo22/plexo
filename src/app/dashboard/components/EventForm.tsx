'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

// Esquema de validación
const EventFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  roomId: z.string().optional(),
  venueId: z.string().optional(),
  status: z.enum(['RESERVED', 'QUOTED', 'CONFIRMED', 'CANCELLED']),
  notes: z.string().optional(),
  isFullVenue: z.boolean().optional(),
  colorCode: z.string().optional()
})

type EventFormData = z.infer<typeof EventFormSchema>

interface EventFormProps {
  eventId?: string // Si se pasa, es edición
  initialData?: Partial<EventFormData>
  onSuccess?: (eventId: string) => void
  onCancel?: () => void
  className?: string
}

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Room {
  id: string
  name: string
  capacity: number
}

interface Venue {
  id: string
  name: string
  address: string
}

interface AvailabilityConflict {
  id: string
  title: string
  startDate: string
  endDate: string
  client?: {
    firstName: string
    lastName: string
  }
}

export function EventForm({ 
  eventId, 
  initialData, 
  onSuccess, 
  onCancel, 
  className = '' 
}: EventFormProps) {
  const router = useRouter()
  
  // Estados del formulario
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    clientId: initialData?.clientId || '',
    roomId: initialData?.roomId || undefined,
    venueId: initialData?.venueId || undefined,
    status: initialData?.status || 'RESERVED',
    notes: initialData?.notes || '',
    isFullVenue: initialData?.isFullVenue || false,
    colorCode: initialData?.colorCode || ''
  })

  // Estados de carga y errores
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Estados para opciones de selección
  const [clients, setClients] = useState<Client[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Estados de disponibilidad
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityConflicts, setAvailabilityConflicts] = useState<AvailabilityConflict[]>([])

  // Cargar opciones iniciales
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true)
      try {
        const [clientsRes, roomsRes, venuesRes] = await Promise.all([
          fetch('/api/clients?limit=1000'),
          fetch('/api/rooms?limit=1000'),
          fetch('/api/venues?limit=1000')
        ])

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          if (clientsData.success) {
            setClients(clientsData.data.clients || clientsData.data)
          }
        }

        if (roomsRes.ok) {
          const roomsData = await roomsRes.json()
          if (roomsData.success) {
            setRooms(roomsData.data.rooms || roomsData.data)
          }
        }

        if (venuesRes.ok) {
          const venuesData = await venuesRes.json()
          if (venuesData.success) {
            setVenues(venuesData.data.venues || venuesData.data)
          }
        }
      } catch (error) {
        console.error('Error loading options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [])

  // Verificar disponibilidad cuando cambian las fechas o ubicación
  useEffect(() => {
    if (formData.startDate && formData.endDate && (formData.roomId || formData.venueId)) {
      checkAvailability()
    }
  }, [formData.startDate, formData.endDate, formData.roomId, formData.venueId])

  const checkAvailability = async () => {
    setCheckingAvailability(true)
    setAvailabilityConflicts([])

    try {
      const requestData = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        ...(formData.roomId && { roomId: formData.roomId }),
        ...(formData.venueId && { venueId: formData.venueId }),
        ...(eventId && { excludeEventId: eventId })
      }

      const response = await fetch('/api/events/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && !data.data.available) {
          setAvailabilityConflicts(data.data.conflicts)
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    try {
      EventFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Validar fechas
    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)

    if (startDate >= endDate) {
      setErrors({ endDate: 'La fecha de fin debe ser posterior a la fecha de inicio' })
      return
    }

    setLoading(true)
    setSubmitError(null)

    try {
      const url = eventId ? `/api/events/${eventId}` : '/api/events'
      const method = eventId ? 'PUT' : 'POST'

      // Limpiar datos opcional
      const submitData = { ...formData }
      if (!submitData.roomId) delete submitData.roomId
      if (!submitData.venueId) delete submitData.venueId
      if (!submitData.notes) delete submitData.notes
      if (!submitData.colorCode) delete submitData.colorCode

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(data.data.id)
          } else {
            router.push('/dashboard/events')
          }
        }, 1000)
      } else {
        setSubmitError(data.error || 'Error al guardar el evento')
      }
    } catch (error) {
      setSubmitError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'RESERVED', label: 'Reservado', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'QUOTED', label: 'Cotizado', color: 'bg-blue-100 text-blue-800' },
    { value: 'CONFIRMED', label: 'Confirmado', color: 'bg-green-100 text-green-800' },
    { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ]

  if (success) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {eventId ? 'Evento actualizado' : 'Evento creado'} exitosamente
          </h3>
          <p className="text-muted-foreground text-center">
            {eventId ? 'Los cambios han sido guardados' : 'El nuevo evento ha sido registrado en el sistema'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {eventId ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </CardTitle>
        <CardDescription>
          {eventId ? 'Modifica la información del evento' : 'Completa los datos para crear un nuevo evento'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Evento *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ej: Matrimonio Silva-González"
                  className={errors['title'] ? 'border-red-500' : ''}
                />
                {errors['title'] && (
                  <p className="text-sm text-red-500">{errors['title']}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fechas y horarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Fechas y Horarios
              {checkingAvailability && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha y Hora de Inicio *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={errors['startDate'] ? 'border-red-500' : ''}
                />
                {errors['startDate'] && (
                  <p className="text-sm text-red-500">{errors['startDate']}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha y Hora de Fin *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className={errors['endDate'] ? 'border-red-500' : ''}
                />
                {errors['endDate'] && (
                  <p className="text-sm text-red-500">{errors['endDate']}</p>
                )}
              </div>
            </div>

            {/* Conflictos de disponibilidad */}
            {availabilityConflicts.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">¡Conflicto de horario detectado!</p>
                    <p>Los siguientes eventos coinciden con las fechas seleccionadas:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {availabilityConflicts.map((conflict) => (
                        <li key={conflict.id} className="text-sm">
                          <strong>{conflict.title}</strong> - 
                          {conflict.client && ` ${conflict.client.firstName} ${conflict.client.lastName}`}
                          <br />
                          <span className="text-muted-foreground">
                            {new Date(conflict.startDate).toLocaleString()} - 
                            {new Date(conflict.endDate).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Cliente y ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente y Ubicación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => handleChange('clientId', value)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger className={errors['clientId'] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors['clientId'] && (
                  <p className="text-sm text-red-500">{errors['clientId']}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">Sala</Label>
                <Select 
                  value={formData.roomId || ''} 
                  onValueChange={(value) => handleChange('roomId', value || undefined)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una sala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin sala específica</SelectItem>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} (Cap: {room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venueId">Venue</Label>
                <Select 
                  value={formData.venueId || ''} 
                  onValueChange={(value) => handleChange('venueId', value || undefined)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin venue específico</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notas Adicionales</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Información adicional sobre el evento..."
                rows={3}
              />
            </div>
          </div>

          {/* Error de envío */}
          {submitError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || availabilityConflicts.length > 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {eventId ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {eventId ? 'Actualizar Evento' : 'Crear Evento'}
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel || (() => router.back())}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}