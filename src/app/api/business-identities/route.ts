import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema de validación para identidades de negocio
const createBusinessIdentitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  website: z.string().url('URL inválida').optional(),
  logo: z.string().optional(),
  slogan: z.string().optional(),
  isDefault: z.boolean().default(false)
})

// GET /api/business-identities - Listar identidades de negocio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId
    }

    if (isActive !== null) where.isActive = isActive === 'true'

    const businessIdentities = await prisma.businessIdentity.findMany({
      where,
      include: {
        locations: {
          include: {
            rooms: {
              select: { id: true, name: true, isActive: true }
            }
          }
        },
        quoteTemplates: {
          where: { isActive: true },
          select: { id: true, name: true, isDefault: true }
        },
        _count: {
          select: {
            quotes: true,
            events: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: businessIdentities
    })

  } catch (error) {
    console.error('Error al obtener identidades de negocio:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/business-identities - Crear identidad de negocio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo TENANT_ADMIN y MANAGER pueden crear identidades
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createBusinessIdentitySchema.parse(body)

    // Verificar límite de identidades por tenant (máximo 5)
    const currentCount = await prisma.businessIdentity.count({
      where: { tenantId: session.user.tenantId }
    })

    if (currentCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Máximo 5 identidades de negocio por organización' },
        { status: 400 }
      )
    }

    // Si es la primera identidad o se marca como default, hacer transacción
    const businessIdentity = await prisma.$transaction(async (tx) => {
      // Si se marca como default o es la primera, quitar default de las demás
      if (validatedData.isDefault || currentCount === 0) {
        await tx.businessIdentity.updateMany({
          where: { tenantId: session.user.tenantId },
          data: { isDefault: false }
        })
        validatedData.isDefault = true
      }

      return await tx.businessIdentity.create({
        data: {
          ...validatedData,
          tenantId: session.user.tenantId
        },
        include: {
          _count: {
            select: {
              quotes: true,
              events: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: businessIdentity,
      message: 'Identidad de negocio creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear identidad de negocio:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}