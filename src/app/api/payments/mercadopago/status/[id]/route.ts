import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mercadoPagoPayment } from '@/lib/mercadopago'
import { $Enums } from '@prisma/client'

interface RouteParams {
  params: { id: string }
}

// GET /api/payments/mercadopago/status/[id] - Consultar estado de pago
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const paymentId = params.id

    // Buscar el pago en nuestra base de datos
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: session.user.tenantId
      },
      include: {
        quote: {
          include: {
            client: {
              select: { id: true, name: true, email: true }
            },
            event: {
              select: { id: true, title: true, startDate: true, status: true }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const isClientExternal = session.user.role?.roleId === $Enums.RoleType.CLIENT_EXTERNAL
    const isStaff = [
      $Enums.RoleType.SUPER_ADMIN, 
      $Enums.RoleType.TENANT_ADMIN, 
      $Enums.RoleType.MANAGER, 
      $Enums.RoleType.USER
    ].includes(session.user.role?.roleId as $Enums.RoleType)

    if (!isStaff && isClientExternal) {
      // Si es cliente externo, verificar que es su propio pago
      const clientUser = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId
        }
      })

      if (!clientUser || payment.quote.clientId !== clientUser.id) {
        return NextResponse.json(
          { error: 'No puedes acceder a este pago' },
          { status: 403 }
        )
      }
    } else if (!isStaff) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Si tenemos ID de pago de MercadoPago, consultarlo para obtener info actualizada
    let mercadoPagoStatus = null
    if (payment.mercadoPagoPaymentId) {
      try {
        const mpPayment = await mercadoPagoPayment.get({ 
          id: payment.mercadoPagoPaymentId 
        })
        
        if (mpPayment) {
          mercadoPagoStatus = {
            id: mpPayment.id,
            status: mpPayment.status,
            statusDetail: mpPayment.status_detail,
            transactionAmount: mpPayment.transaction_amount,
            currencyId: mpPayment.currency_id,
            paymentMethod: mpPayment.payment_method?.id,
            paymentType: mpPayment.payment_type?.id,
            installments: mpPayment.installments,
            dateCreated: mpPayment.date_created,
            dateApproved: mpPayment.date_approved,
            dateLastUpdated: mpPayment.date_last_updated
          }

          // Si el estado cambió, actualizarlo en la BD
          const statusMapping: Record<string, $Enums.PaymentStatus> = {
            'pending': $Enums.PaymentStatus.PENDING,
            'approved': $Enums.PaymentStatus.APPROVED,
            'authorized': $Enums.PaymentStatus.AUTHORIZED,
            'in_process': $Enums.PaymentStatus.IN_PROCESS,
            'in_mediation': $Enums.PaymentStatus.IN_MEDIATION,
            'rejected': $Enums.PaymentStatus.REJECTED,
            'cancelled': $Enums.PaymentStatus.CANCELLED,
            'refunded': $Enums.PaymentStatus.REFUNDED,
            'charged_back': $Enums.PaymentStatus.CHARGED_BACK
          }

          const newStatus = statusMapping[mpPayment.status || 'pending']
          
          if (newStatus && newStatus !== payment.status) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: newStatus,
                paidAt: mpPayment.status === 'approved' ? new Date() : payment.paidAt,
                updatedAt: new Date()
              }
            })
            payment.status = newStatus
          }
        }
      } catch (mpError) {
        console.error('Error consultando estado en MercadoPago:', mpError)
        // No fallar la consulta si MercadoPago no responde
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        externalReference: payment.externalReference,
        installments: payment.installments,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        quote: {
          id: payment.quote.id,
          quoteNumber: payment.quote.quoteNumber,
          status: payment.quote.status,
          total: payment.quote.total,
          client: payment.quote.client,
          event: payment.quote.event
        },
        mercadoPagoStatus
      }
    })

  } catch (error) {
    console.error('Error consultando estado de pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}