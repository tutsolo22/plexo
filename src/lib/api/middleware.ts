import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

// =====================
// TIPOS Y INTERFACES
// =====================

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    name?: string
    role: UserRole
  }
}

export type ApiHandler = (
  request: AuthenticatedRequest,
  context?: any
) => Promise<NextResponse>

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
  message?: string
}

// =====================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================

/**
 * Middleware para verificar autenticación
 * Reutilizable en todas las API routes que requieren auth
 */
export function withAuth(handler: ApiHandler, requiredRole?: UserRole) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const session = await auth()

      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 401 }
        )
      }

      // Verificar rol si es requerido
      if (requiredRole && session.user.role !== requiredRole) {
        // Verificar jerarquía de roles
        const roleHierarchy = {
          [UserRole.USER]: 0,
          [UserRole.MANAGER]: 1,
          [UserRole.ADMIN]: 2,
          [UserRole.SUPER_ADMIN]: 3,
        }

        const userRoleLevel = roleHierarchy[session.user.role as UserRole]
        const requiredRoleLevel = roleHierarchy[requiredRole]

        if (userRoleLevel < requiredRoleLevel) {
          return NextResponse.json(
            { success: false, error: 'Permisos insuficientes' },
            { status: 403 }
          )
        }
      }

      // Extender request con datos de usuario
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = {
        id: session.user.id!,
        email: session.user.email!,
        ...(session.user.name && { name: session.user.name }),
        role: session.user.role as UserRole,
      }

      return await handler(authenticatedRequest, context)
    } catch (error) {
      console.error('Error en middleware de autenticación:', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }
}

// =====================
// MIDDLEWARE DE VALIDACIÓN
// =====================

/**
 * Middleware para validar datos con Zod
 * Reutilizable para validar body, query params, etc.
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (request: AuthenticatedRequest, validatedData: T, context?: any) => Promise<NextResponse>,
  options: {
    validateBody?: boolean
    validateQuery?: boolean
    requireAuth?: boolean
  } = { validateBody: true, requireAuth: true }
) {
  const wrappedHandler = async (request: AuthenticatedRequest, context?: any) => {
    try {
      let dataToValidate: any

      if (options.validateBody) {
        try {
          dataToValidate = await request.json()
        } catch {
          return NextResponse.json(
            { success: false, error: 'JSON inválido en el cuerpo de la petición' },
            { status: 400 }
          )
        }
      } else if (options.validateQuery) {
        const { searchParams } = new URL(request.url)
        dataToValidate = Object.fromEntries(searchParams)
      }

      const validation = schema.safeParse(dataToValidate)

      if (!validation.success) {
        const errors: Record<string, string> = {}
        validation.error.issues.forEach((issue) => {
          const path = issue.path.join('.')
          errors[path] = issue.message
        })

        return NextResponse.json(
          {
            success: false,
            error: 'Datos de entrada inválidos',
            errors,
          },
          { status: 400 }
        )
      }

      return await handler(request, validation.data, context)
    } catch (error) {
      console.error('Error en middleware de validación:', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  // Aplicar autenticación si es requerida
  if (options.requireAuth) {
    return withAuth(wrappedHandler)
  }

  return wrappedHandler
}

// =====================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================

/**
 * Wrapper para manejo consistente de errores
 * Reutilizable en todas las API routes
 */
export function withErrorHandling(handler: ApiHandler) {
  return async (request: AuthenticatedRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('Error no manejado en API route:', error)

      // Errores de Prisma
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any

        switch (prismaError.code) {
          case 'P2002':
            return NextResponse.json(
              { success: false, error: 'Ya existe un registro con estos datos únicos' },
              { status: 409 }
            )
          case 'P2025':
            return NextResponse.json(
              { success: false, error: 'Registro no encontrado' },
              { status: 404 }
            )
          case 'P2003':
            return NextResponse.json(
              { success: false, error: 'Violación de restricción de clave foránea' },
              { status: 400 }
            )
          default:
            console.error('Error de Prisma:', prismaError)
        }
      }

      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }
}

// =====================
// MIDDLEWARE COMPUESTO
// =====================

/**
 * Middleware completo que combina autenticación, validación y manejo de errores
 * Patrón DRY para API routes estándar
 */
export function withApiHandler<T>(
  handler: (request: AuthenticatedRequest, validatedData?: T, context?: any) => Promise<NextResponse>,
  options: {
    schema?: z.ZodSchema<T>
    requiredRole?: UserRole
    validateBody?: boolean
    validateQuery?: boolean
  } = {}
) {
  let wrappedHandler = handler

  // Aplicar validación si hay schema
  if (options.schema) {
    wrappedHandler = withValidation(
      options.schema,
      handler,
      {
        ...(options.validateBody !== undefined && { validateBody: options.validateBody }),
        ...(options.validateQuery !== undefined && { validateQuery: options.validateQuery }),
        requireAuth: true,
      }
    )
  }

  // Aplicar autenticación (solo si no se aplicó en validación)
  if (!options.schema) {
    wrappedHandler = withAuth(wrappedHandler, options.requiredRole)
  }

  // Siempre aplicar manejo de errores
  return withErrorHandling(wrappedHandler)
}

// =====================
// UTILIDADES DE RESPUESTA
// =====================

/**
 * Funciones helper para respuestas consistentes
 */
export const ApiResponses = {
  success: <T>(data: T, message?: string, status = 200) => {
    return NextResponse.json(
      { success: true, data, message },
      { status }
    )
  },

  created: <T>(data: T, message = 'Creado exitosamente') => {
    return NextResponse.json(
      { success: true, data, message },
      { status: 201 }
    )
  },

  error: (error: string, status = 400) => {
    return NextResponse.json(
      { success: false, error },
      { status }
    )
  },

  validationError: (errors: Record<string, string>) => {
    return NextResponse.json(
      { success: false, error: 'Datos de entrada inválidos', errors },
      { status: 400 }
    )
  },

  notFound: (resource = 'Recurso') => {
    return NextResponse.json(
      { success: false, error: `${resource} no encontrado` },
      { status: 404 }
    )
  },

  unauthorized: (message = 'No autorizado') => {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    )
  },

  forbidden: (message = 'Permisos insuficientes') => {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 }
    )
  },

  serverError: (message = 'Error interno del servidor') => {
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  },
}

// =====================
// UTILIDADES DE PAGINACIÓN
// =====================

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url)
  
  const result: PaginationParams = {
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
    sortOrder: (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
  }

  const sortBy = searchParams.get('sortBy')
  if (sortBy) {
    result.sortBy = sortBy
  }

  return result
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)
  
  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  }
}