'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EventForm } from '../../components/EventForm'

export default function NewEventPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialData, setInitialData] = useState<any>({})

  useEffect(() => {
    // Si vienen fechas en los parámetros (desde selección en calendario)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (start && end) {
      setInitialData({
        startDate: start,
        endDate: end
      })
    }
  }, [searchParams])

  const handleSuccess = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Evento</h1>
        <p className="text-muted-foreground">
          Registra un nuevo evento en el sistema
        </p>
      </div>

      <EventForm
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}