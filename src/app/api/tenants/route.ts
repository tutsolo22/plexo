import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { $Enums } from '@prisma/client'

// Schema de validación para tenants
const createTenantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  domain: z.string().min(1, 'El dominio es requerido'),
  isActive: z.boolean().default(true)
})

// const updateTenantSchema = createTenantSchema.partial() // Para uso futuro

// GET /api/tenants - Listar tenants (Solo SUPER_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo SUPER_ADMIN puede listar tenants
    if (session.user.role !== $Enums.RoleType.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {}

    if (search) {
      where["OR"] = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null) where["isActive"] = isActive === 'true'

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              events: true,
              quotes: true,
              businessIdentities: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener tenants:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/tenants - Crear tenant (Solo SUPER_ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo SUPER_ADMIN puede crear tenants
    if (session.user.role !== $Enums.RoleType.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createTenantSchema.parse(body)

    // Verificar dominio único
    const existingTenant = await prisma.tenant.findUnique({
      where: { domain: validatedData.domain }
    })

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un tenant con ese dominio' },
        { status: 400 }
      )
    }

    const tenant = await prisma.$transaction(async (tx) => {
      // Crear el tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: validatedData.name,
          domain: validatedData.domain,
          isActive: validatedData.isActive
        }
      })

      // Crear identidad de negocio por defecto
      await tx.businessIdentity.create({
        data: {
          name: validatedData.name,
          tenantId: newTenant.id
        }
      })

      // Crear lista de precios por defecto
      await tx.priceList.create({
        data: {
          name: 'General',
          tenantId: newTenant.id,
          isActive: true
        }
      })

      // Crear configuraciones por defecto
      const defaultConfigs = [
        { key: 'company_name', value: validatedData.name },
        { key: 'quote_validity_days', value: '30' },
        { key: 'max_discount_percent', value: '50' },
        { key: 'default_tax_rate', value: '0' }
      ]

      for (const config of defaultConfigs) {
        await tx.configuration.create({
          data: {
            ...config,
            tenantId: newTenant.id
          }
        })
      }

      return newTenant
    })

    return NextResponse.json({
      success: true,
      data: tenant,
      message: 'Tenant creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}