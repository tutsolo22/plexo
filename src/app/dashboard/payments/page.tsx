"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CreditCard, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Wallet,
  AlertCircle
} from "lucide-react"

interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'digital'
  name: string
  last4?: string
  brand?: string
  expires?: string
  isDefault: boolean
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  method: string
}

export default function PaymentsPage() {
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Tarjeta Principal',
      last4: '4242',
      brand: 'Visa',
      expires: '12/26',
      isDefault: true
    },
    {
      id: '2',
      type: 'bank',
      name: 'Cuenta Bancaria BBVA',
      last4: '8765',
      isDefault: false
    },
    {
      id: '3',
      type: 'digital',
      name: 'PayPal Business',
      isDefault: false
    }
  ])

  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-10-18',
      description: 'Pago de cotización #COT-001',
      amount: 25000,
      status: 'completed',
      method: 'Visa •••• 4242'
    },
    {
      id: '2',
      date: '2025-10-17',
      description: 'Evento: Boda en Jardín Principal',
      amount: 45000,
      status: 'completed',
      method: 'Transferencia Bancaria'
    },
    {
      id: '3',
      date: '2025-10-16',
      description: 'Anticipo evento corporativo',
      amount: 15000,
      status: 'pending',
      method: 'PayPal'
    },
    {
      id: '4',
      date: '2025-10-15',
      description: 'Reembolso cliente',
      amount: -5000,
      status: 'completed',
      method: 'Visa •••• 4242'
    }
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const totalRevenue = transactions
    .filter(t => t.status === 'completed' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingAmount = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pagos y Facturación</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Gestiona métodos de pago, transacciones y facturación
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Este Mes</p>
                <p className="text-2xl font-bold">{formatCurrency(85000)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendientes</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-plexo-purple" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Crecimiento</p>
                <p className="text-2xl font-bold">+12.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métodos de Pago */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Gestiona tus métodos de pago
                </CardDescription>
              </div>
              <Button size="sm" className="bg-plexo-purple hover:bg-plexo-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {method.brand && `${method.brand} •••• ${method.last4}`}
                      {method.type === 'bank' && `•••• ${method.last4}`}
                      {method.type === 'digital' && 'Cuenta digital'}
                    </p>
                    {method.expires && (
                      <p className="text-xs text-gray-500">Expira {method.expires}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {method.isDefault && (
                    <Badge variant="secondary">Predeterminado</Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Transacciones Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transacciones Recientes
            </CardTitle>
            <CardDescription>
              Historial de pagos y cobros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(transaction.date).toLocaleDateString('es-MX')} • {transaction.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de Facturación */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Facturación</CardTitle>
          <CardDescription>
            Información para la generación de facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="taxId">RFC</Label>
            <Input id="taxId" placeholder="ABCD123456789" />
          </div>
          <div>
            <Label htmlFor="businessName">Razón Social</Label>
            <Input id="businessName" placeholder="Plexo Eventos S.A. de C.V." />
          </div>
          <div>
            <Label htmlFor="billingAddress">Dirección Fiscal</Label>
            <Input id="billingAddress" placeholder="Av. Revolución 123, Ciudad de México" />
          </div>
          <div>
            <Label htmlFor="taxRegime">Régimen Fiscal</Label>
            <select className="w-full p-2 border rounded-md">
              <option>Régimen General de Personas Morales</option>
              <option>Régimen Simplificado de Confianza</option>
              <option>Persona Física con Actividad Empresarial</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}