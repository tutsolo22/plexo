'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface MercadoPagoPaymentButtonProps {
  quoteId: string
  amount: number
  description?: string
  installments?: number
  onPaymentCreated?: (data: any) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export function MercadoPagoPaymentButton({
  quoteId,
  amount,
  description,
  installments = 1,
  onPaymentCreated,
  onError,
  className,
  disabled = false
}: MercadoPagoPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCreatePayment = async () => {
    if (disabled || isLoading) return

    try {
      setIsLoading(true)

      const response = await fetch('/api/payments/mercadopago/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteId,
          amount,
          description,
          installments
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error creando el pago')
      }

      if (data.success) {
        // Llamar callback si existe
        onPaymentCreated?.(data.data)

        // Redirigir a MercadoPago
        const initPoint = process.env.NODE_ENV === 'production' 
          ? data.data.initPoint 
          : data.data.sandboxInitPoint

        if (initPoint) {
          window.open(initPoint, '_blank')
          toast.success('Redirigiendo a MercadoPago...')
        } else {
          throw new Error('No se pudo obtener el enlace de pago')
        }
      } else {
        throw new Error(data.error || 'Error desconocido')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error creando pago:', error)
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(amount)
  }

  return (
    <Button
      onClick={handleCreatePayment}
      disabled={disabled || isLoading}
      className={className}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creando pago...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pagar {formatCurrency(amount)} con MercadoPago
          <ExternalLink className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}