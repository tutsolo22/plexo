'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PaymentFailurePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const externalReference = searchParams.get('ref')
  const status = searchParams.get('status')

  const handleRetry = () => {
    // Redirigir de vuelta a la cotización para intentar el pago nuevamente
    router.back()
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handleGoToSupport = () => {
    // Aquí podrías redirigir a una página de soporte o abrir un chat
    router.push('/dashboard/support')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Mensaje de error */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">
              Pago No Procesado
            </CardTitle>
            <p className="text-gray-600 mt-2">
              No pudimos procesar tu pago en este momento
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
              <Button onClick={handleRetry} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar Nuevamente
              </Button>
              <Button onClick={handleGoToDashboard} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posibles razones del error */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posibles causas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Fondos insuficientes</h4>
                <p className="text-sm text-gray-600">
                  Verifica que tu tarjeta o cuenta tenga fondos suficientes
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Tarjeta rechazada</h4>
                <p className="text-sm text-gray-600">
                  Tu banco pudo haber rechazado la transacción por seguridad
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Datos incorrectos</h4>
                <p className="text-sm text-gray-600">
                  Verifica que los datos de tu tarjeta sean correctos
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Problema temporal</h4>
                <p className="text-sm text-gray-600">
                  Puede ser un problema temporal con el procesador de pagos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opciones de ayuda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¿Necesitas ayuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600">
              Si el problema persiste, nuestro equipo de soporte está aquí para ayudarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleGoToSupport} variant="outline" className="flex-1">
                Contactar Soporte
              </Button>
              <Button 
                onClick={() => window.open('tel:+50212345678', '_self')} 
                variant="outline" 
                className="flex-1"
              >
                Llamar Directamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}