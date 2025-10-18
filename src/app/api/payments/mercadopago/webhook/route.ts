import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mercadoPagoPayment } from '@/lib/mercadopago';
import { $Enums } from '@prisma/client';

// POST /api/payments/mercadopago/webhook - Webhook de notificaciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // console.log('MercadoPago Webhook recibido:', JSON.stringify(body, null, 2))

    // Validar que es una notificación de pago
    if (body.type !== 'payment') {
      console.log('Notificación ignorada, tipo:', body.type);
      return NextResponse.json({ status: 'ignored' });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      // console.error('ID de pago no encontrado en webhook')
      return NextResponse.json({ error: 'Payment ID missing' }, { status: 400 });
    }

    // Obtener detalles del pago desde MercadoPago
    const mpPayment = await mercadoPagoPayment.get({ id: paymentId });

    if (!mpPayment) {
      // console.error('Pago no encontrado en MercadoPago:', paymentId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // console.log('Detalles del pago MP:', JSON.stringify(mpPayment, null, 2))

    // Buscar el pago en nuestra base de datos
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { mercadoPagoPaymentId: paymentId.toString() },
          ...(mpPayment.external_reference ? [{ externalReference: mpPayment.external_reference }] : []),
        ],
      },
      include: {
        quote: {
          include: {
            event: true,
            client: true,
          },
        },
      },
    });

    if (!payment) {
      // console.error('Pago no encontrado en BD:', {
      //   mercadoPagoPaymentId: paymentId,
      //   externalReference: mpPayment.external_reference
      // })
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Mapear el estado de MercadoPago a nuestro enum
    const statusMapping: Record<string, $Enums.PaymentStatus> = {
      pending: $Enums.PaymentStatus.PENDING,
      approved: $Enums.PaymentStatus.APPROVED,
      authorized: $Enums.PaymentStatus.AUTHORIZED,
      in_process: $Enums.PaymentStatus.IN_PROCESS,
      in_mediation: $Enums.PaymentStatus.IN_MEDIATION,
      rejected: $Enums.PaymentStatus.REJECTED,
      cancelled: $Enums.PaymentStatus.CANCELLED,
      refunded: $Enums.PaymentStatus.REFUNDED,
      charged_back: $Enums.PaymentStatus.CHARGED_BACK,
    };

    const newStatus = statusMapping[mpPayment.status || 'pending'] || $Enums.PaymentStatus.PENDING;

    // Actualizar el pago en nuestra base de datos
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        mercadoPagoPaymentId: paymentId.toString(),
        ...(mpPayment.transaction_amount ? { transactionId: mpPayment.transaction_amount.toString() } : {}),
        ...(mpPayment.authorization_code ? { authorizationCode: mpPayment.authorization_code } : {}),
        ...(mpPayment.installments ? { installments: mpPayment.installments } : {}),
        ...(mpPayment.status === 'approved' ? { paidAt: new Date() } : {}),
        metadata: {
          ...((payment.metadata as object) || {}),
          mercadoPagoData: {
            status: mpPayment.status,
            statusDetail: mpPayment.status_detail,
            paymentMethodId: mpPayment.payment_method?.id,
            paymentTypeId: mpPayment.payment_type_id,
            currencyId: mpPayment.currency_id,
            transactionAmount: mpPayment.transaction_amount,
            collectorId: mpPayment.collector_id,
            operationType: mpPayment.operation_type,
            dateCreated: mpPayment.date_created,
            dateApproved: mpPayment.date_approved,
            lastModified: mpPayment.date_last_updated,
          },
        },
      },
    });

    console.log('Pago actualizado:', updatedPayment.id, 'Estado:', newStatus);

    // Si el pago fue aprobado, actualizar la cotización y evento
    if (newStatus === $Enums.PaymentStatus.APPROVED && payment.quote) {
      // Actualizar estado de la cotización
      if (payment.quote.status !== $Enums.QuoteStatus.ACCEPTED_BY_CLIENT) {
        await prisma.quote.update({
          where: { id: payment.quoteId },
          data: {
            status: $Enums.QuoteStatus.ACCEPTED_BY_CLIENT,
            updatedAt: new Date(),
          },
        });
        // console.log('Cotización actualizada a ACCEPTED_BY_CLIENT:', payment.quoteId)
      }

      // Si hay un evento asociado, confirmarlo
      if (payment.quote.event && payment.quote.event.status !== $Enums.EventStatus.CONFIRMED) {
        await prisma.event.update({
          where: { id: payment.quote.event.id },
          data: {
            status: $Enums.EventStatus.CONFIRMED,
            updatedAt: new Date(),
          },
        });
        // console.log('Evento confirmado:', payment.quote.event.id)
      }

      // Crear log de auditoría
      await prisma.auditLog.create({
        data: {
          action: 'PAYMENT_APPROVED',
          tableName: 'Payment',
          recordId: payment.id,
          newData: {
            paymentApproved: true,
            amount: mpPayment.transaction_amount,
            currency: mpPayment.currency_id
          },
          tenantId: payment.tenantId,
          userId: payment.quote.client.userId || payment.tenantId // Use client's userId or fallback to tenantId
          // metadata field doesn't exist in AuditLog schema
          // metadata: {
          //   mercadoPagoPaymentId: paymentId,
          //   quoteId: payment.quoteId,
          //   eventId: payment.quote.event?.id || null,
          //   clientId: payment.quote.client.id,
          // }
        }
      });
    }

    // TODO: Enviar notificación por email al cliente y al staff
    // TODO: Actualizar cualquier sistema de créditos si aplica

    return NextResponse.json({
      status: 'processed',
      paymentId: payment.id,
      newStatus: newStatus,
    });
  } catch (error) {
    console.error('Error procesando webhook de MercadoPago:', error);

    // Log del error en auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_ERROR',
          tableName: 'Payment',
          recordId: 'unknown',
          newData: {
            error: error instanceof Error ? error.message : 'Error desconocido'
          },
          tenantId: 'system',
          userId: 'system' // Use system user for error logs
          // metadata field doesn't exist in AuditLog schema
          // metadata: {
          //   error: error instanceof Error ? error.stack : String(error),
          //   webhook_body: await request
          //     .clone()
          //     .json()
          //     .catch(() => 'Could not parse body'),
          // },
        },
      });
    } catch (auditError) {
      console.error('Error creando log de auditoría:', auditError);
    }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
