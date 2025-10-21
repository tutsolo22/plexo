import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { updateClientSchema } from '@/lib/validations/client';

// GET /api/clients/[id] - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        deletedAt: null, // Solo mostrar no eliminados
        // tenantId: session.user.tenantId // TODO: Habilitar cuando se implemente auth
      },
      include: {
        priceList: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        events: {
          include: {
            room: {
              include: {
                location: {
                  include: {
                    businessIdentity: true
                  }
                }
              }
            }
          },
          orderBy: { startDate: 'desc' },
          take: 10
        },
        quotes: {
          include: {
            event: {
              include: {
                room: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        clientCredits: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            events: true,
            quotes: true,
            documents: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    // Verificar que el cliente existe
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        deletedAt: null, // Solo actualizar no eliminados
        // tenantId: session.user.tenantId // TODO: Habilitar cuando se implemente auth
      }
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar email único si se está actualizando
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          deletedAt: null,
          // tenantId: session.user.tenantId,
          id: { not: params.id }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con ese email' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.email !== undefined && { email: validatedData.email }),
      ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
      ...(validatedData.address !== undefined && { address: validatedData.address }),
      ...(validatedData.company !== undefined && { company: validatedData.company }),
      ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      ...(validatedData.type !== undefined && { type: validatedData.type }),
      ...(validatedData.discountPercent !== undefined && { discountPercent: validatedData.discountPercent }),
      ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
    };

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
      include: {
        priceList: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            events: true,
            quotes: true,
            documents: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Cliente actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: (error as z.ZodError).errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Soft delete cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el cliente existe
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        deletedAt: null, // Solo eliminar no eliminados
        // tenantId: session.user.tenantId // TODO: Habilitar cuando se implemente auth
      },
      include: {
        _count: {
          select: {
            events: true,
            quotes: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete - marcar como eliminado
    await prisma.client.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}