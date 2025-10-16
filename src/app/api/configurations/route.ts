import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { $Enums } from '@prisma/client'

// Schema de validación para configuraciones
const updateConfigSchema = z.object({
  key: z.string().min(1, 'La clave es requerida'),
  value: z.string().min(1, 'El valor es requerido')
})

// GET /api/configurations - Obtener configuraciones
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId
    }

    if (key) where["key"] = key

    const configurations = await prisma.configuration.findMany({
      where,
      orderBy: { key: 'asc' }
    })

    // Si se busca una clave específica, devolver solo el valor
    if (key && configurations.length === 1) {
      return NextResponse.json({
        success: true,
        data: configurations[0]?.value
      })
    }

    // Convertir a objeto clave-valor para facilitar uso
    const configMap = configurations.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({
      success: true,
      data: configMap
    })

  } catch (error) {
    console.error('Error al obtener configuraciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/configurations - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden actualizar configuraciones
    const allowedRoles: $Enums.RoleType[] = [$Enums.RoleType.SUPER_ADMIN, $Enums.RoleType.TENANT_ADMIN, $Enums.RoleType.MANAGER]
    if (!session.user.role?.roleId || !allowedRoles.includes(session.user.role.roleId as $Enums.RoleType)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateConfigSchema.parse(body)

    // Verificar si la configuración existe
    const existingConfig = await prisma.configuration.findFirst({
      where: {
        key: validatedData.key,
        tenantId: session.user.tenantId
      }
    })

    let configuration
    if (existingConfig) {
      // Actualizar configuración existente
      configuration = await prisma.configuration.update({
        where: { id: existingConfig.id },
        data: { value: validatedData.value }
      })
    } else {
      // Crear nueva configuración
      configuration = await prisma.configuration.create({
        data: {
          ...validatedData,
          tenantId: session.user.tenantId
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: configuration,
      message: 'Configuración actualizada exitosamente'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar configuración:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/configurations - Crear múltiples configuraciones
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo TENANT_ADMIN y SUPER_ADMIN pueden crear configuraciones en lote
    const allowedRoles: $Enums.RoleType[] = [$Enums.RoleType.SUPER_ADMIN, $Enums.RoleType.TENANT_ADMIN]
    if (!session.user.role?.roleId || !allowedRoles.includes(session.user.role.roleId as $Enums.RoleType)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const configs = z.array(updateConfigSchema).parse(body)

    const configurations = await prisma.$transaction(
      configs.map(config => 
        prisma.configuration.upsert({
          where: {
            tenantId_key: {
              tenantId: session.user.tenantId,
              key: config.key
            }
          },
          update: { value: config.value },
          create: {
            ...config,
            tenantId: session.user.tenantId
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: configurations,
      message: 'Configuraciones actualizadas exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear configuraciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}