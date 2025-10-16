import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { $Enums } from '@prisma/client'

// Schema de validación para actualizar cliente
const updateClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(['GENERAL', 'COLABORADOR', 'EXTERNO']).optional(),
  priceListId: z.string().optional(),
  isActive: z.boolean().optional()
})

// GET /api/clients/[id] - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const where: Record<string, unknown> = {
      id: params.id,
      tenantId: session.user.tenantId
    }

    // CLIENT_EXTERNAL solo puede ver sus propios datos
    const userRoleType = session.user.role.roleId as $Enums.RoleType
    if (userRoleType === $Enums.RoleType.CLIENT_EXTERNAL) {
      where["userId"] = session.user.id
    }

    const client = await prisma.client.findFirst({
      where,
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
          take: 5
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
          take: 5
        },
        clientCredits: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            events: true,
            quotes: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: client
    })

  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden actualizar clientes
    const userRoleType = session.user.role.roleId as $Enums.RoleType
    if (userRoleType !== $Enums.RoleType.SUPER_ADMIN && 
        userRoleType !== $Enums.RoleType.TENANT_ADMIN && 
        userRoleType !== $Enums.RoleType.MANAGER && 
        userRoleType !== $Enums.RoleType.USER) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    // Verificar que el cliente existe y pertenece al tenant
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar email único si se está actualizando
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          tenantId: session.user.tenantId,
          id: { not: params.id }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con ese email' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.email !== undefined && { email: validatedData.email }),
      ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
      ...(validatedData.address !== undefined && { address: validatedData.address }),
      ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      ...(validatedData.type !== undefined && { type: validatedData.type }),
      ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
      include: {
        priceList: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Cliente actualizado exitosamente'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden eliminar
    const userRoleType = session.user.role.roleId as $Enums.RoleType
    if (userRoleType !== $Enums.RoleType.SUPER_ADMIN && 
        userRoleType !== $Enums.RoleType.TENANT_ADMIN) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Verificar que el cliente existe
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      },
      include: {
        _count: {
          select: {
            events: true,
            quotes: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si tiene eventos o cotizaciones asociadas
    if (client._count.events > 0 || client._count.quotes > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar el cliente porque tiene eventos o cotizaciones asociadas' 
        },
        { status: 400 }
      )
    }

    await prisma.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}