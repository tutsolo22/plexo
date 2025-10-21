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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600 text-center">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">

        {/* Header de Agradecimiento */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ¡Gracias por Elegirnos!
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-500" />
            <p className="text-xl text-gray-600">
              Tu evento está en las mejores manos
            </p>
            <Heart className="h-5 w-5 text-red-500" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">

          {/* Información del Evento */}
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Calendar className="h-5 w-5" />
                Detalles de tu Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{quoteData.event.title}</h3>
                  <div className="space-y-2 text-gray-600">
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
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-center">
                    <Badge className="bg-green-100 text-green-800 mb-2">
                      Cotización Aceptada
                    </Badge>
                    <p className="text-sm text-gray-600 mb-1">Cotización #{quoteData.quoteNumber}</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(quoteData.total)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos Pasos */}
          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <FileText className="h-5 w-5" />
                Próximos Pasos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Contacto Personal</h4>
                      <p className="text-gray-600 text-sm">
                        Nos pondremos en contacto contigo en las próximas 24 horas para coordinar los detalles finales.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Firma del Contrato</h4>
                      <p className="text-gray-600 text-sm">
                        Firmaremos el contrato oficial, ya sea en nuestras instalaciones o a domicilio según tu preferencia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Planificación Detallada</h4>
                      <p className="text-gray-600 text-sm">
                        Trabajaremos juntos para perfeccionar cada detalle y hacer de tu evento algo inolvidable.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <h4 className="font-semibold text-amber-800">Promesa de Calidad</h4>
                  </div>
                  <p className="text-amber-700 text-sm mb-4">
                    Nos comprometemos a brindarte un servicio excepcional y hacer de tu evento una experiencia memorable que supere tus expectativas.
                  </p>
                  <div className="flex items-center gap-2 text-amber-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Equipo {quoteData.businessIdentity.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card className="border-gray-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Datos del Cliente</h4>
                  <div className="space-y-2 text-gray-600">
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
                  <h4 className="font-semibold text-gray-900 mb-3">Nuestros Datos</h4>
                  <div className="space-y-2 text-gray-600">
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

          {/* Footer de Agradecimiento */}
          <div className="text-center py-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Gracias por Confiar en Nosotros!
              </h3>
              <p className="text-gray-600 mb-4">
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