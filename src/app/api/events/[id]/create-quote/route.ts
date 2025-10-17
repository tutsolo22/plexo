import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateQuoteFromEventSchema = z.object({
  templateId: z.string().cuid().optional(),
  title: z.string().min(1, 'El título de la cotización es requerido'),
  description: z.string().optional(),
  validUntil: z.string().datetime().optional(),
  packages: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    quantity: z.number().int().min(1).default(1),
    items: z.array(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0)
    })).optional().default([])
  })).optional().default([]),
  adjustments: z.array(z.object({
    type: z.enum(['discount', 'surcharge']),
    description: z.string().min(1),
    amount: z.number().min(0),
    percentage: z.number().min(0).max(100).optional()
  })).optional().default([]),
  autoSend: z.boolean().optional().default(false),
  emailTemplate: z.enum(['basic', 'professional', 'custom']).optional().default('professional')
});

/**
 * POST /api/events/[id]/create-quote - Crear cotización desde evento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    const validatedData = CreateQuoteFromEventSchema.parse(body);

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        client: true,
        room: true,
        venue: true
      }
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Generar número de cotización
    const year = new Date().getFullYear();
    const lastQuote = await prisma.quote.findFirst({
      where: {
        quoteNumber: {
          startsWith: `COT-${year}-`
        }
      },
      orderBy: { quoteNumber: 'desc' }
    });

    const lastNumber = lastQuote ? 
      parseInt(lastQuote.quoteNumber.split('-')[2] || '0') : 0;
    const quoteNumber = `COT-${year}-${String(lastNumber + 1).padStart(4, '0')}`;

    // Calcular fecha de validez por defecto (30 días)
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

    // Calcular totales
    const packagesTotal = validatedData.packages.reduce((sum, pkg) => 
      sum + (pkg.price * pkg.quantity), 0
    );
    
    const adjustmentsTotal = validatedData.adjustments.reduce((sum, adj) => 
      sum + (adj.type === 'discount' ? -adj.amount : adj.amount), 0
    );
    
    const total = Math.max(0, packagesTotal + adjustmentsTotal);

    // Crear la cotización en una transacción
    const quote = await prisma.$transaction(async (tx) => {
      // Crear la cotización
      const newQuote = await tx.quote.create({
        data: {
          quoteNumber,
          title: validatedData.title,
          description: validatedData.description,
          status: 'DRAFT',
          total,
          validUntil: validatedData.validUntil ? 
            new Date(validatedData.validUntil) : defaultValidUntil,
          clientId: event.clientId,
          eventId: event.id,
          templateId: validatedData.templateId,
          metadata: {
            generatedFromEvent: true,
            eventDetails: {
              title: event.title,
              startDate: event.startDate,
              endDate: event.endDate,
              venue: event.venue?.name,
              room: event.room?.name,
              isFullVenue: event.isFullVenue
            }
          }
        }
      });

      // Crear los paquetes
      for (const packageData of validatedData.packages) {
        const quotePackage = await tx.quotePackage.create({
          data: {
            quoteId: newQuote.id,
            name: packageData.name,
            description: packageData.description,
            price: packageData.price,
            quantity: packageData.quantity
          }
        });

        // Crear los items del paquete
        for (const itemData of packageData.items) {
          await tx.quotePackageItem.create({
            data: {
              packageId: quotePackage.id,
              name: itemData.name,
              description: itemData.description,
              quantity: itemData.quantity,
              unitPrice: itemData.unitPrice
            }
          });
        }
      }

      // Crear los ajustes
      for (const adjustmentData of validatedData.adjustments) {
        await tx.quoteAdjustment.create({
          data: {
            quoteId: newQuote.id,
            type: adjustmentData.type,
            description: adjustmentData.description,
            amount: adjustmentData.amount,
            percentage: adjustmentData.percentage
          }
        });
      }

      return newQuote;
    });

    // Si se solicita envío automático
    if (validatedData.autoSend) {
      try {
        const sendResponse = await fetch(`${request.nextUrl.origin}/api/quotes/${quote.id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template: validatedData.emailTemplate
          })
        });

        if (sendResponse.ok) {
          await prisma.quote.update({
            where: { id: quote.id },
            data: { status: 'SENT' }
          });
        }
      } catch (error) {
        console.error('Error enviando cotización automáticamente:', error);
        // No fallar la creación si el envío falla
      }
    }

    // Obtener la cotización completa con relaciones
    const completeQuote = await prisma.quote.findUnique({
      where: { id: quote.id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            venue: { select: { name: true } },
            room: { select: { name: true } }
          }
        },
        packages: {
          include: {
            items: true
          }
        },
        adjustments: true,
        template: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: completeQuote,
      message: validatedData.autoSend ? 
        'Cotización creada y enviada exitosamente' : 
        'Cotización creada exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Error creando cotización desde evento:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}