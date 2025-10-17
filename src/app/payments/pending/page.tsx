'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Loader2, ArrowRight } from 'lucide-react'
import { PaymentStatus } from '@/components/payments'

export default function PaymentPendingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const externalReference = searchParams.get('ref')
  const mercadoPagoPaymentId = searchParams.get('payment_id')

  useEffect(() => {
    const findPayment = async () => {
      if (!externalReference && !mercadoPagoPaymentId) {
        setIsLoading(false)
        return
      }

      try {
        // Buscar el pago por referencia externa
        const response = await fetch(`/api/payments?limit=1&reference=${externalReference}`)
        const data = await response.json()

        if (data.success && data.data.length > 0) {
          setPaymentId(data.data[0].id)
        }
      } catch (error) {
        console.error('Error buscando pago:', error)
      } finally {
        setIsLoading(false)
      }
    }

    findPayment()
  }, [externalReference, mercadoPagoPaymentId])

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handleGoToQuotes = () => {
    router.push('/dashboard/quotes')
  }

  const handlePaymentStatusChange = (newStatus: string) => {
    if (newStatus === 'APPROVED') {
      // Redirigir a la página de éxito
      router.replace(`/payments/success?ref=${externalReference}`)
    } else if (['REJECTED', 'CANCELLED'].includes(newStatus)) {
      // Redirigir a la página de error
      router.replace(`/payments/failure?ref=${externalReference}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-center text-gray-600">
              Verificando tu pago...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Mensaje de pendiente */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-800">
              Pago en Proceso
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Tu pago está siendo procesado, por favor espera
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {externalReference && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Referencia de pago</p>
                <p className="font-mono text-sm font-medium">{externalReference}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>No cierres esta página.</strong> El estado se actualizará automáticamente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleGoToDashboard} variant="outline">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir al Dashboard
              </Button>
              <Button onClick={handleGoToQuotes} variant="outline">
                Ver mis Cotizaciones
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado del pago con auto-refresh */}
        {paymentId && (
          <PaymentStatus
            paymentId={paymentId}
            showDetails={true}
            refreshInterval={5000} // Refrescar cada 5 segundos
            onStatusChange={handlePaymentStatusChange}
          />
        )}

        {/* Información sobre tiempos de procesamiento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiempos de procesamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Tarjetas de crédito/débito</h4>
                <p className="text-sm text-gray-600">
                  Usualmente procesado en pocos minutos
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Transferencias bancarias</h4>
                <p className="text-sm text-gray-600">
                  Pueden tomar de 1 a 3 días hábiles
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Efectivo en sucursales</h4>
                <p className="text-sm text-gray-600">
                  Procesado inmediatamente al realizar el pago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nota importante */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm text-orange-800">
              <strong>Importante:</strong> Si realizaste un pago en efectivo o transferencia, 
              el procesamiento puede tomar más tiempo. Recibirás una notificación por email 
              cuando tu pago sea confirmado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}