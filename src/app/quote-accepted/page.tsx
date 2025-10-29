'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Heart,
  Star,
  Users,
  Home
} from 'lucide-react'

interface QuoteData {
  id: string
  quoteNumber: string
  total: number
  event: {
    title: string
    startDate: string
    endDate: string
    location?: string
  }
  client: {
    name: string
    email: string
    phone?: string
  }
  businessIdentity: {
    name: string
    phone: string
    email: string
    address: string
  }
}

function QuoteAcceptedContent() {
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quote')
  const token = searchParams.get('token')

  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (quoteId && token) {
      fetchQuoteData()
    } else {
      setError('Enlace inválido o expirado')
      setLoading(false)
    }
  }, [quoteId, token])

  const fetchQuoteData = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/public?token=${token}`)
      const data = await response.json()

      if (data.success) {
        setQuoteData(data.data)
      } else {
        setError(data.error || 'Error al cargar los datos')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive text-center">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'}>
              <Home className="h-4 w-4 mr-2" />
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            ¡Gracias por Elegirnos!
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-500" />
            <p className="text-xl text-muted-foreground">
              Tu evento está en las mejores manos
            </p>
            <Heart className="h-5 w-5 text-red-500" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">

          <Card className="border-success/20 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <Calendar className="h-5 w-5" />
                Detalles de tu Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{quoteData.event.title}</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Inicio: {formatDate(quoteData.event.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Fin: {formatDate(quoteData.event.endDate)}</span>
                    </div>
                    {quoteData.event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{quoteData.event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-success/10 p-4 rounded-lg">
                  <div className="text-center">
                    <Badge className="bg-success/20 text-success-foreground mb-2">
                      Cotización Aceptada
                    </Badge>
                    <p className="text-sm text-muted-foreground mb-1">Cotización #{quoteData.quoteNumber}</p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(quoteData.total)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                Próximos Pasos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Contacto Personal</h4>
                      <p className="text-muted-foreground text-sm">
                        Nos pondremos en contacto contigo en las próximas 24 horas para coordinar los detalles finales.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Firma del Contrato</h4>
                      <p className="text-muted-foreground text-sm">
                        Firmaremos el contrato oficial, ya sea en nuestras instalaciones o a domicilio según tu preferencia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Planificación Detallada</h4>
                      <p className="text-muted-foreground text-sm">
                        Trabajaremos juntos para perfeccionar cada detalle y hacer de tu evento algo inolvidable.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/10 p-6 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-accent" />
                    <h4 className="font-semibold text-accent">Promesa de Calidad</h4>
                  </div>
                  <p className="text-accent/80 text-sm mb-4">
                    Nos comprometemos a brindarte un servicio excepcional y hacer de tu evento una experiencia memorable que supere tus expectativas.
                  </p>
                  <div className="flex items-center gap-2 text-accent/90">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Equipo {quoteData.businessIdentity.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Datos del Cliente</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{quoteData.client.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{quoteData.client.email}</span>
                    </div>
                    {quoteData.client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{quoteData.client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Nuestros Datos</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{quoteData.businessIdentity.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{quoteData.businessIdentity.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{quoteData.businessIdentity.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{quoteData.businessIdentity.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center py-8">
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                ¡Gracias por Confiar en Nosotros!
              </h3>
              <p className="text-muted-foreground mb-4">
                Estamos emocionados de ser parte de tu evento especial y nos comprometemos
                a hacer que sea una experiencia inolvidable.
              </p>
              <div className="flex justify-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <Heart className="h-5 w-5 text-red-500" />
                <Heart className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuoteAcceptedPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <QuoteAcceptedContent />
    </Suspense>
  )
}
