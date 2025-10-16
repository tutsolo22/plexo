import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/resend-activation',
    '/auth/activate',
    '/api/auth',
    '/_next',
    '/favicon.ico'
  ]

  // Si es una ruta pública, permitir acceso
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Si no hay token (no autenticado), redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Lógica de redirección basada en roles
  const userRole = token.role as string

  // Clientes externos solo pueden acceder al portal de cliente
  if (userRole === 'CLIENT_EXTERNAL') {
    if (!pathname.startsWith('/client-portal')) {
      return NextResponse.redirect(new URL('/client-portal', request.url))
    }
    return NextResponse.next()
  }

  // Usuarios administrativos no pueden acceder al portal de cliente
  if (pathname.startsWith('/client-portal')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Mejora UX: SUPER_ADMIN que navega a /dashboard va directo a gestión de usuarios
  if (pathname === '/dashboard' && userRole === 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/users', request.url))
  }

  // Para otros roles, permitir acceso a dashboard y rutas administrativas
  const adminRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER']
  if (!adminRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}