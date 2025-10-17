'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventForm } from '../../../components/EventForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvent()
  }, [params.id])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/events/${params.id}`)
      const data = await response.json()

      if (data.success) {
        const event = data.data
        setInitialData({
          title: event.title,
          startDate: event.startDate.slice(0, 16), // Format for datetime-local
          endDate: event.endDate.slice(0, 16),
          clientId: event.client.id,
          roomId: event.room?.id || '',
          venueId: event.venue?.id || '',
          status: event.status,
          notes: event.notes || '',
          isFullVenue: event.isFullVenue,
          colorCode: event.colorCode || ''
        })
      } else {
        setError(data.error || 'Evento no encontrado')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`)
  }

  const handleCancel = () => {
    router.push(`/dashboard/events/${params.id}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando evento...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Evento</h1>
          <p className="text-muted-foreground">
            Modifica la información del evento
          </p>
        </div>
      </div>

      <EventForm
        eventId={params.id}
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}