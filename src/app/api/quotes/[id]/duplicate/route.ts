// app/api/quotes/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

const DuplicateQuoteSchema = z.object({
  clientId: z.string().optional(), // Si se quiere cambiar el cliente
  eventId: z.string().optional(),  // Si se quiere asociar a otro evento
  adjustments: z.object({
    subtotal: z.number().optional(),
    discount: z.number().optional(),
    total: z.number().optional(),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  copyPackages: z.boolean().default(true),
  copyItems: z.boolean().default(true),
  newQuoteNumber: z.boolean().default(true),
});

// Función para generar número de cotización único
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const lastQuote = await prisma.quote.findFirst({
    where: {
      quoteNumber: {
        startsWith: `Q-${year}${month}-`,
      },
    },
    orderBy: {
      quoteNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastQuote) {
    const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2] || '0') || 0;
    nextNumber = lastNumber + 1;
  }

  return `Q-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de cotización requerido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = DuplicateQuoteSchema.parse(body);

    // Obtener cotización original con todos los datos
    const originalQuote = await prisma.quote.findUnique({
      where: { id },
      include: {
        packages: {
          include: {
            packageItems: {
              include: {
                product: true,
                service: true,
              },
            },
          },
        },
        client: true,
        event: true,
        template: true,
      },
    });

    if (!originalQuote) {
      return NextResponse.json(
        { success: false, error: 'Cotización original no encontrada' },
        { status: 404 }
      );
    }

    // Verificar cliente destino
    let targetClientId = validatedData.clientId || originalQuote.clientId;
    if (validatedData.clientId && validatedData.clientId !== originalQuote.clientId) {
      const targetClient = await prisma.client.findUnique({
        where: { id: validatedData.clientId },
      });

      if (!targetClient) {
        return NextResponse.json(
          { success: false, error: 'Cliente destino no encontrado' },
          { status: 404 }
        );
      }
    }

    // Verificar evento destino si se especifica
    if (validatedData.eventId) {
      const targetEvent = await prisma.event.findFirst({
        where: {
          id: validatedData.eventId,
          clientId: targetClientId,
        },
      });

      if (!targetEvent) {
        return NextResponse.json(
          { success: false, error: 'Evento destino no encontrado o no pertenece al cliente' },
          { status: 404 }
        );
      }
    }

    // Generar nuevo número de cotización si se solicita
    const newQuoteNumber = validatedData.newQuoteNumber 
      ? await generateQuoteNumber()
      : `${originalQuote.quoteNumber}-COPY-${Date.now()}`;

    // Crear cotización duplicada en transacción
    const duplicatedQuote = await prisma.$transaction(async (tx) => {
      // Calcular nueva fecha de validez (30 días desde ahora por defecto)
      const defaultValidUntil = new Date();
      defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

      // Crear la cotización principal
      const newQuote = await tx.quote.create({
        data: {
          quoteNumber: newQuoteNumber,
          clientId: targetClientId,
          eventId: validatedData.eventId || originalQuote.eventId,
          templateId: originalQuote.templateId,
          subtotal: validatedData.adjustments?.subtotal || originalQuote.subtotal,
          discount: validatedData.adjustments?.discount || originalQuote.discount,
          total: validatedData.adjustments?.total || originalQuote.total,
          validUntil: validatedData.adjustments?.validUntil 
            ? new Date(validatedData.adjustments.validUntil)
            : defaultValidUntil,
          notes: validatedData.adjustments?.notes || 
            (originalQuote.notes ? `${originalQuote.notes}\n\n[Duplicada de ${originalQuote.quoteNumber}]` : `Duplicada de ${originalQuote.quoteNumber}`),
          tenantId: originalQuote.tenantId,
          status: 'DRAFT', // Siempre empezar como borrador
          
          // No copiar estos campos específicos - los omitimos en lugar de null
          // generatedContent: null,
          // pdfUrl: null,
          version: 1,
          // previousVersionId: null,
          // sentAt: null,
          // viewedAt: null,
          // respondedAt: null,
          // publicToken: null, // Se generará uno nuevo si es necesario
        },
      });

      // Duplicar paquetes si se solicita
      if (validatedData.copyPackages && originalQuote.packages.length > 0) {
        for (const originalPackage of originalQuote.packages) {
          const newPackage = await tx.package.create({
            data: {
              name: originalPackage.name,
              description: originalPackage.description,
              subtotal: originalPackage.subtotal,
              quoteId: newQuote.id,
              tenantId: originalPackage.tenantId,
              packageTemplateId: originalPackage.packageTemplateId,
            },
          });

          // Duplicar items del paquete
          if (originalPackage.packageItems.length > 0) {
            for (const originalItem of originalPackage.packageItems) {
              await tx.packageItem.create({
                data: {
                  packageId: newPackage.id,
                  quantity: originalItem.quantity,
                  unitPrice: originalItem.unitPrice,
                  totalPrice: originalItem.totalPrice,
                  description: originalItem.description,
                  productId: originalItem.productId,
                  serviceId: originalItem.serviceId,
                },
              });
            }
          }
        }
      }

      // Crear comentario del sistema
      await tx.quoteComment.create({
        data: {
          quoteId: newQuote.id,
          userId: 'system', // En producción, usar el ID del usuario actual
          type: 'SYSTEM_NOTE',
          comment: `Cotización duplicada desde ${originalQuote.quoteNumber}${validatedData.clientId !== originalQuote.clientId ? ` para nuevo cliente` : ''}`,
        },
      });

      // Retornar cotización completa
      return tx.quote.findUnique({
        where: { id: newQuote.id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true,
            },
          },
          packages: {
            include: {
              packageItems: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  service: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: duplicatedQuote,
      message: `Cotización duplicada exitosamente como ${newQuoteNumber}`,
      originalQuoteId: id,
      duplicatedQuoteId: duplicatedQuote?.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Error duplicating quote:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor duplicando cotización',
      },
      { status: 500 }
    );
  }
}

// GET para obtener información sobre duplicaciones
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de cotización requerido' },
        { status: 400 }
      );
    }

    // Buscar cotizaciones relacionadas (duplicadas desde esta o que duplicaron esta)
    const [originalQuote, duplicatedTo, duplicatedFrom] = await Promise.all([
      // Cotización original
      prisma.quote.findUnique({
        where: { id },
        select: {
          id: true,
          quoteNumber: true,
          createdAt: true,
          status: true,
        },
      }),
      
      // Cotizaciones que fueron duplicadas desde esta
      prisma.quote.findMany({
        where: {
          comments: {
            some: {
              comment: {
                contains: id,
              },
              type: 'SYSTEM_NOTE',
            },
          },
        },
        select: {
          id: true,
          quoteNumber: true,
          createdAt: true,
          status: true,
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      
      // Buscar si esta cotización fue duplicada desde otra
      prisma.quoteComment.findFirst({
        where: {
          quoteId: id,
          type: 'SYSTEM_NOTE',
          comment: {
            contains: 'Cotización duplicada desde',
          },
        },
        select: {
          comment: true,
        },
      }),
    ]);

    if (!originalQuote) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Extraer ID de cotización original si fue duplicada
    let originalQuoteId = null;
    if (duplicatedFrom && duplicatedFrom.comment) {
      const match = duplicatedFrom.comment.match(/Q-\d{6}-\d{4}/);
      if (match) {
        const originalQuoteNumber = match[0];
        const original = await prisma.quote.findUnique({
          where: { quoteNumber: originalQuoteNumber },
          select: {
            id: true,
            quoteNumber: true,
            createdAt: true,
            status: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        });
        if (original) {
          originalQuoteId = original;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        canDuplicate: originalQuote.status !== 'CANCELLED',
        wasDuplicated: !!duplicatedFrom,
        originalQuote: originalQuoteId,
        duplicatedQuotes: duplicatedTo || [],
        duplicatedCount: duplicatedTo?.length || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching quote duplication info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo información de duplicación',
      },
      { status: 500 }
    );
  }
}