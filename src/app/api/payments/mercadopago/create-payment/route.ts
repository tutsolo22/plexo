import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mercadoPagoPreference } from '@/lib/mercadopago';
import { z } from 'zod';
import { $Enums } from '@prisma/client';

// Schema de validación para crear pago
const createPaymentSchema = z.object({
  quoteId: z.string().min(1, 'ID de cotización requerido'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  description: z.string().optional(),
  installments: z.number().min(1).max(24).optional().default(1),
  externalReference: z.string().optional(),
});

// POST /api/payments/mercadopago/create-payment - Crear preferencia de pago
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Validar datos de entrada
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Verificar que la cotización existe y pertenece al usuario
    const quote = await prisma.quote.findFirst({
      where: {
        id: validatedData.quoteId,
        tenantId: session.user.tenantId,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        event: {
          select: { id: true, title: true, startDate: true },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Solo clientes externos o staff pueden crear pagos
    const isClientExternal = session.user.role === $Enums.RoleType.CLIENT_EXTERNAL;
    const isStaff = [
      $Enums.RoleType.SUPER_ADMIN,
      $Enums.RoleType.TENANT_ADMIN,
      $Enums.RoleType.MANAGER,
      $Enums.RoleType.USER,
      $Enums.RoleType.CLIENT_EXTERNAL,
      $Enums.RoleType.SALES,
      $Enums.RoleType.COORDINATOR,
      $Enums.RoleType.FINANCE,
    ].includes(session.user.role as $Enums.RoleType);

    if (!isClientExternal && !isStaff) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    // Si es cliente externo, verificar que es su propia cotización
    if (isClientExternal) {
      const clientUser = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      });

      if (!clientUser || quote.clientId !== clientUser.id) {
        return NextResponse.json({ error: 'No puedes acceder a esta cotización' }, { status: 403 });
      }
    }

    // Generar referencia externa única
    const externalReference = validatedData.externalReference || `quote-${quote.id}-${Date.now()}`;

    // Crear preferencia en MercadoPago
    const preferenceData = {
      items: [
        {
          id: quote.id,
          title:
            validatedData.description || `Pago para evento: ${quote.event?.title || 'Sin título'}`,
          description: `Cotización #${quote.quoteNumber} - ${quote.client.name}`,
          quantity: 1,
          unit_price: validatedData.amount,
          currency_id: 'GTQ', // Guatemala Quetzal
        },
      ],
      payer: {
        name: quote.client.name,
        ...(quote.client.email ? { email: quote.client.email } : {}),
      },
      external_reference: externalReference,
      notification_url: `${process.env['NEXTAUTH_URL']}/api/payments/mercadopago/webhook`,
      back_urls: {
        success: `${process.env['NEXTAUTH_URL']}/payments/success?ref=${externalReference}`,
        failure: `${process.env['NEXTAUTH_URL']}/payments/failure?ref=${externalReference}`,
        pending: `${process.env['NEXTAUTH_URL']}/payments/pending?ref=${externalReference}`,
      },
      auto_return: 'approved' as const,
      installments: validatedData.installments,
      statement_descriptor: 'CASONA MARIA',
      metadata: {
        quote_id: quote.id,
        tenant_id: session.user.tenantId,
        user_id: session.user.id,
        client_id: quote.clientId,
      },
    };

    const preference = await mercadoPagoPreference.create({ body: preferenceData });

    // Guardar registro del pago en la base de datos
    const paymentRecord = await prisma.payment.create({
      data: {
        quoteId: quote.id,
        tenantId: session.user.tenantId,
        mercadoPagoPreferenceId: preference.id || '',
        externalReference: externalReference,
        amount: validatedData.amount,
        currency: 'GTQ',
        status: 'PENDING',
        paymentMethod: 'MERCADOPAGO',
        metadata: {
          installments: validatedData.installments,
          description: validatedData.description,
          createdBy: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        externalReference: externalReference,
        paymentId: paymentRecord.id,
        amount: validatedData.amount,
        currency: 'GTQ',
      },
      message: 'Preferencia de pago creada exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear preferencia de pago:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
