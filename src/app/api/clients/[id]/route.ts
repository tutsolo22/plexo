import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { updateClientSchema } from '@/lib/validations/client';
import { ApiResponses } from '@/lib/api/responses';

// GET /api/clients/[id] - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponses.unauthorized('No autenticado');
    }

    const tenantId = session.user.tenantId;

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId, // ✅ Autenticación habilitada
        deletedAt: null,
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
      return ApiResponses.notFound('Cliente no encontrado');
    }

    return ApiResponses.success({ client });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return ApiResponses.internalError('Error obteniendo cliente');
  }
}

// PUT /api/clients/[id] - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponses.unauthorized('No autenticado');
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    // Verificar que el cliente existe y pertenece al tenant
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId, // ✅ Autenticación habilitada
        deletedAt: null,
      }
    });

    if (!existingClient) {
      return ApiResponses.notFound('Cliente no encontrado o no tienes permisos');
    }

    // Verificar email único si se está actualizando
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          tenantId, // ✅ Autenticación habilitada
          deletedAt: null,
          id: { not: params.id }
        }
      });

      if (emailExists) {
        return ApiResponses.badRequest('Ya existe un cliente con ese email');
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

    console.log('✅ Cliente actualizado:', updatedClient.id);

    return ApiResponses.success({
      client: updatedClient,
      message: 'Cliente actualizado exitosamente',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest('Datos inválidos', (error as z.ZodError).errors);
    }

    console.error('Error al actualizar cliente:', error);
    return ApiResponses.internalError('Error actualizando cliente');
  }
}

// DELETE /api/clients/[id] - Soft delete cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponses.unauthorized('No autenticado');
    }

    const tenantId = session.user.tenantId;

    // Verificar que el cliente existe y pertenece al tenant
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId, // ✅ Autenticación habilitada
        deletedAt: null,
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
      return ApiResponses.notFound('Cliente no encontrado o no tienes permisos');
    }

    // Soft delete - marcar como eliminado
    await prisma.client.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });

    console.log('🗑️ Cliente eliminado (soft delete):', params.id);

    return ApiResponses.success({
      message: 'Cliente eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return ApiResponses.internalError('Error eliminando cliente');
  }
}