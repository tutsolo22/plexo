import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { QuoteStatus } from '@prisma/client';
import { NotificationService } from '@/lib/notifications/notification-service';

// Schema de validación para crear cotización
const createQuoteSchema = z.object({
  clientId: z.string().min(1, 'El cliente es requerido'),
  eventId: z.string().optional(),
  validUntil: z
    .string()
    .transform(str => new Date(str))
    .optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  businessIdentityId: z.string().min(1, 'La identidad de negocio es requerida'),
  packages: z
    .array(
      z.object({
        packageTemplateId: z.string(),
        quantity: z.number().min(1),
        customPrice: z.number().optional(),
      })
    )
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        serviceId: z.string().optional(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        description: z.string().optional(),
      })
    )
    .optional(),
});

// Función para generar número de cotización
async function generateQuoteNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;

  const lastQuote = await prisma.quote.findFirst({
    where: {
      tenantId,
      quoteNumber: { startsWith: prefix },
    },
    orderBy: { quoteNumber: 'desc' },
  });

  let nextNumber = 1;
  if (lastQuote) {
    const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2] || '0') || 0;
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

// GET /api/quotes - Listar cotizaciones
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
    };

    if (search) {
      where['OR'] = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where['status'] = status;
    if (clientId) where['clientId'] = clientId;

    // CLIENT_EXTERNAL solo puede ver sus propias cotizaciones
    const userRole = (session.user as any).role;
    if (userRole === 'CLIENT_EXTERNAL') {
      where['client'] = { userId: session.user.id };
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true, type: true },
          },
          event: {
            include: {
              room: {
                include: {
                  location: {
                    include: {
                      businessIdentity: {
                        select: { id: true, name: true },
                      },
                    },
                  },
                },
              },
            },
          },
          packages: {
            include: {
              packageTemplate: true,
              packageItems: {
                include: {
                  product: true,
                  service: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/quotes - Crear cotización
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo ciertos roles pueden crear cotizaciones
    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER'].includes(userRole)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createQuoteSchema.parse(body);

    // Verificar que el cliente existe
    const client = await prisma.client.findFirst({
      where: {
        id: validatedData.clientId,
        tenantId: session.user.tenantId,
      },
      include: {
        priceList: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Verificar la identidad de negocio
    const businessIdentity = await prisma.businessIdentity.findFirst({
      where: {
        id: validatedData.businessIdentityId,
        tenantId: session.user.tenantId,
      },
    });

    if (!businessIdentity) {
      return NextResponse.json(
        { success: false, error: 'Identidad de negocio no encontrada' },
        { status: 404 }
      );
    }

    // Verificar evento si se proporciona
    if (validatedData.eventId) {
      const event = await prisma.event.findFirst({
        where: {
          id: validatedData.eventId,
          tenantId: session.user.tenantId,
          clientId: validatedData.clientId,
        },
      });

      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Evento no encontrado o no pertenece al cliente' },
          { status: 404 }
        );
      }
    }

    // Generar número de cotización
    const quoteNumber = await generateQuoteNumber(session.user.tenantId);

    // Calcular fecha de validez por defecto (30 días)
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

    // Crear cotización con transacción
    const quote = await prisma.$transaction(async tx => {
      // Crear la cotización
      const newQuote = await tx.quote.create({
        data: {
          quoteNumber,
          clientId: validatedData.clientId,
          ...(validatedData.eventId ? { eventId: validatedData.eventId } : {}),
          tenantId: session.user.tenantId,
          validUntil: validatedData.validUntil || defaultValidUntil,
          ...(validatedData.notes ? { notes: validatedData.notes } : {}),
          status: QuoteStatus.DRAFT,
          subtotal: 0, // Se calculará después con los paquetes
          total: 0, // Se calculará después con los paquetes
        },
      });

      let subtotal = 0;
      let total = 0;

      // Procesar paquetes si existen
      if (validatedData.packages && validatedData.packages.length > 0) {
        for (const pkg of validatedData.packages) {
          const packageTemplate = await tx.packageTemplate.findFirst({
            where: {
              id: pkg.packageTemplateId,
              tenantId: session.user.tenantId,
            },
            include: {
              packageItems: {
                include: {
                  product: true,
                  service: true,
                },
              },
            },
          });

          if (!packageTemplate) continue;

          // Calcular precio del paquete
          let packageSubtotal = 0;
          if (pkg.customPrice && pkg.customPrice > 0) {
            packageSubtotal = pkg.customPrice;
          } else {
            // Calcular basado en items del template
            for (const item of packageTemplate.packageItems) {
              const itemPrice = Number(item.product?.price || item.service?.price || 0);
              packageSubtotal += itemPrice * item.quantity;
            }
          }

          const packageTotal = packageSubtotal * pkg.quantity;

          // Crear el paquete en la cotización
          const quotePackage = await tx.package.create({
            data: {
              quoteId: newQuote.id,
              packageTemplateId: pkg.packageTemplateId,
              name: packageTemplate.name,
              description: packageTemplate.description,
              subtotal: packageTotal,
              tenantId: session.user.tenantId,
            },
          });

          // Crear los items del paquete
          for (const item of packageTemplate.packageItems) {
            const itemPrice = Number(item.product?.price || item.service?.price || 0);
            const itemQuantity = item.quantity * pkg.quantity;
            const itemTotal = itemPrice * itemQuantity;

            await tx.packageItem.create({
              data: {
                packageId: quotePackage.id,
                ...(item.productId ? { productId: item.productId } : {}),
                ...(item.serviceId ? { serviceId: item.serviceId } : {}),
                quantity: itemQuantity,
                unitPrice: itemPrice,
                totalPrice: itemTotal,
                description: item.description,
              },
            });
          }

          subtotal += packageTotal;
        }
      }

      // Procesar items individuales si existen
      if (validatedData.items && validatedData.items.length > 0) {
        // Crear un paquete "adicional" para items individuales
        const additionalPackage = await tx.package.create({
          data: {
            quoteId: newQuote.id,
            name: 'Items Adicionales',
            description: 'Items individuales agregados a la cotización',
            subtotal: 0, // Se calculará
            tenantId: session.user.tenantId,
          },
        });

        let packageSubtotal = 0;

        for (const item of validatedData.items) {
          const itemTotal = item.unitPrice * item.quantity;
          packageSubtotal += itemTotal;

          await tx.packageItem.create({
            data: {
              packageId: additionalPackage.id,
              productId: item.productId || null,
              serviceId: item.serviceId || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: itemTotal,
              description: item.description || null,
            },
          });
        }

        // Actualizar subtotal del paquete adicional
        await tx.package.update({
          where: { id: additionalPackage.id },
          data: { subtotal: packageSubtotal },
        });

        subtotal += packageSubtotal;
      }

      // Calcular impuestos (IVA 21% por defecto - configurable después)
      const taxRate = 0.21; // TODO: Hacer configurable por tenant/businessIdentity
      const taxAmount = subtotal * taxRate;
      total = subtotal + taxAmount;

      // Aplicar descuento si existe
      const discount = client.discountPercent ? (total * Number(client.discountPercent)) / 100 : 0;
      total = total - discount;

      // Actualizar totales de la cotización
      const updatedQuote = await tx.quote.update({
        where: { id: newQuote.id },
        data: {
          subtotal: subtotal,
          discount: discount,
          total: total,
        },
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true, type: true },
          },
          event: {
            include: {
              room: {
                include: {
                  location: {
                    include: {
                      businessIdentity: true,
                    },
                  },
                },
              },
            },
          },
          packages: {
            include: {
              packageTemplate: true,
              packageItems: {
                include: {
                  product: true,
                  service: true,
                },
              },
            },
          },
        },
      });

      return updatedQuote;
    });

    // Enviar notificaciones después de crear la cotización exitosamente
    try {
      await NotificationService.notifyQuoteCreated(quote.id);
    } catch (notificationError) {
      console.error('Error enviando notificaciones:', notificationError);
      // No fallar la respuesta por error en notificaciones
    }

    return NextResponse.json(
      {
        success: true,
        data: quote,
        message: 'Cotización creada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear cotización:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
