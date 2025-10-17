'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentStatusProps {
  paymentId: string
  onStatusChange?: (newStatus: string) => void
  showDetails?: boolean
  refreshInterval?: number // milliseconds
}

interface PaymentData {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  externalReference: string
  installments?: number
  paidAt?: string
  createdAt: string
  updatedAt: string
  quote: {
    id: string
    quoteNumber: string
    status: string
    total: number
    client: {
      id: string
      name: string
      email: string
    }
    event?: {
      id: string
      title: string
      startDate: string
      status: string
    }
  }
  mercadoPagoStatus?: any
}

export function PaymentStatus({
  paymentId,
  onStatusChange,
  showDetails = false,
  refreshInterval = 30000 // 30 segundos por defecto
}: PaymentStatusProps) {
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchPaymentStatus = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      else setIsRefreshing(true)

      const response = await fetch(`/api/payments/mercadopago/status/${paymentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error consultando el pago')
      }

      if (data.success) {
        const oldStatus = payment?.status
        setPayment(data.data)
        
        // Notificar si cambió el estado
        if (oldStatus && oldStatus !== data.data.status) {
          onStatusChange?.(data.data.status)
          toast.success(`Estado del pago actualizado: ${getStatusLabel(data.data.status)}`)
        }
      } else {
        throw new Error(data.error || 'Error desconocido')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error consultando pago:', error)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPaymentStatus()

    // Auto-refresh solo si el pago está pendiente
    let interval: NodeJS.Timeout | null = null
    
    if (refreshInterval > 0) {
      interval = setInterval(() => {
        if (payment && ['PENDING', 'IN_PROCESS', 'AUTHORIZED'].includes(payment.status)) {
          fetchPaymentStatus(false)
        }
      }, refreshInterval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [paymentId, refreshInterval, payment?.status])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
      case 'CANCELLED':
      case 'CHARGED_BACK':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'PENDING':
      case 'IN_PROCESS':
      case 'AUTHORIZED':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'IN_MEDIATION':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED':
      case 'CANCELLED':
      case 'CHARGED_BACK':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PENDING':
      case 'IN_PROCESS':
      case 'AUTHORIZED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'IN_MEDIATION':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobado',
      'AUTHORIZED': 'Autorizado',
      'IN_PROCESS': 'En Proceso',
      'IN_MEDIATION': 'En Mediación',
      'REJECTED': 'Rechazado',
      'CANCELLED': 'Cancelado',
      'REFUNDED': 'Reembolsado',
      'CHARGED_BACK': 'Contracargo'
    }
    return labels[status] || status
  }

  const formatCurrency = (amount: number, currency: string = 'GTQ') => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Consultando estado del pago...</span>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center p-4 text-gray-500">
        No se pudo cargar la información del pago
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Estado del Pago
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchPaymentStatus(false)}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estado principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(payment.status)}
              <Badge className={getStatusColor(payment.status)}>
                {getStatusLabel(payment.status)}
              </Badge>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatCurrency(payment.amount, payment.currency)}
              </div>
              {payment.installments && payment.installments > 1 && (
                <div className="text-xs text-gray-500">
                  {payment.installments} cuotas
                </div>
              )}
            </div>
          </div>

          {/* Detalles adicionales */}
          {showDetails && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Referencia:</span>
                <span className="font-mono text-xs">{payment.externalReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cotización:</span>
                <span>#{payment.quote.quoteNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span>{payment.quote.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Creado:</span>
                <span>{formatDate(payment.createdAt)}</span>
              </div>
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pagado:</span>
                  <span>{formatDate(payment.paidAt)}</span>
                </div>
              )}
            </div>
          )}

          {/* Info del evento si existe */}
          {payment.quote.event && (
            <div className="pt-2 border-t">
              <div className="text-sm">
                <div className="font-medium">{payment.quote.event.title}</div>
                <div className="text-gray-500">
                  {formatDate(payment.quote.event.startDate)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}