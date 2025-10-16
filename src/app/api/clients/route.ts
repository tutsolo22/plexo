import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema de validación para crear cliente
const createClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(['GENERAL', 'COLABORADOR', 'EXTERNO']).default('GENERAL'),
  priceListId: z.string().optional()
})

// GET /api/clients - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type) {
      where.type = type
    }

    // Solo CLIENT_EXTERNAL puede ver sus propios datos
    if (session.user.role === UserRole.CLIENT_EXTERNAL) {
      where.userId = session.user.id
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          priceList: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              events: true,
              quotes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Crear cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear clientes
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.USER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Verificar email único si se proporciona
    if (validatedData.email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          tenantId: session.user.tenantId
        }
      })

      if (existingClient) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con ese email' },
          { status: 400 }
        )
      }
    }

    // Obtener lista de precios por defecto si no se especifica
    let priceListId = validatedData.priceListId
    if (!priceListId) {
      const defaultPriceList = await prisma.priceList.findFirst({
        where: {
          tenantId: session.user.tenantId,
          isActive: true,
          type: 'GENERAL'
        }
      })
      priceListId = defaultPriceList?.id
    }

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        tenantId: session.user.tenantId,
        userId: session.user.id,
        priceListId
      },
      include: {
        priceList: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Cliente creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}