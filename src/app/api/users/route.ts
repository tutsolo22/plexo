import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema de validación para usuarios
const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER', 'CLIENT_EXTERNAL']).default('USER'),
  phone: z.string().optional(),
  isActive: z.boolean().default(true)
})

// const updateUserSchema = z.object({
//   name: z.string().min(1, 'El nombre es requerido').optional(),
//   email: z.string().email('Email inválido').optional(),
//   password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
//   role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER', 'CLIENT_EXTERNAL']).optional(),
//   phone: z.string().optional(),
//   isActive: z.boolean().optional()
// }) // Para uso futuro

// GET /api/users - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden listar usuarios
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {}

    // SUPER_ADMIN ve todos los usuarios, otros solo los de su tenant
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      where.tenantId = session.user.tenantId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) where.role = role
    if (isActive !== null) where.isActive = isActive === 'true'

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          },
          _count: {
            select: {
              createdClients: true,
              createdEvents: true,
              createdQuotes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/users - Crear usuario
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear usuarios
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Verificar email único
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      )
    }

    // Validar permisos de rol
    if (session.user.role === UserRole.TENANT_ADMIN) {
      // TENANT_ADMIN no puede crear SUPER_ADMIN
      if (validatedData.role === UserRole.SUPER_ADMIN) {
        return NextResponse.json(
          { success: false, error: 'No puedes crear usuarios SUPER_ADMIN' },
          { status: 403 }
        )
      }
    }

    // Hash de la contraseña
    const { hashPassword } = await import('@/lib/auth/password')
    const hashedPassword = await hashPassword(validatedData.password)

    // Determinar tenant
    let tenantId = session.user.tenantId
    if (session.user.role === UserRole.SUPER_ADMIN && validatedData.role === UserRole.SUPER_ADMIN) {
      tenantId = null // SUPER_ADMIN puede no pertenecer a un tenant específico
    }

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        phone: validatedData.phone,
        isActive: validatedData.isActive,
        tenantId,
        emailVerified: new Date() // Auto-verificar en creación administrativa
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Usuario creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}