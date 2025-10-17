'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import { PaymentStatus } from '@/components/payments'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const externalReference = searchParams.get('ref')
  const mercadoPagoPaymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')

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
        {/* Mensaje de éxito */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              ¡Pago Exitoso!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Tu pago ha sido procesado correctamente
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {externalReference && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Referencia de pago</p>
                <p className="font-mono text-sm font-medium">{externalReference}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleGoToDashboard} variant="default">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir al Dashboard
              </Button>
              <Button onClick={handleGoToQuotes} variant="outline">
                Ver mis Cotizaciones
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado del pago */}
        {paymentId && (
          <PaymentStatus
            paymentId={paymentId}
            showDetails={true}
            refreshInterval={10000} // Refrescar cada 10 segundos
          />
        )}

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¿Qué sigue?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Confirmación por email</h4>
                <p className="text-sm text-gray-600">
                  Recibirás un email de confirmación con los detalles de tu pago
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Evento confirmado</h4>
                <p className="text-sm text-gray-600">
                  Tu evento ha sido confirmado automáticamente
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Próximos pasos</h4>
                <p className="text-sm text-gray-600">
                  Nuestro equipo se pondrá en contacto contigo para coordinar los detalles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}