import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Middleware de NextAuth para proteger rutas
 * 
 * Rutas protegidas:
 * - /dashboard/*
 * - /admin/*
 * - /settings/*
 * 
 * Rutas públicas:
 * - /auth/*
 * - /api/auth/*
 * - /
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no necesitan autenticación
  const publicRoutes = [
    '/auth/signin',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/activate',
    '/auth/resend-activation',
  ];

  // Rutas protegidas que REQUIEREN autenticación
  const protectedRoutes = ['/dashboard', '/admin', '/settings'];

  // Si es una ruta pública, permitir acceso sin verificar sesión
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Si es una ruta protegida, verificar autenticación
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const session = await auth();

    if (!session || !session.user) {
      // Redirigir a login con callback URL
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Permitir acceso para otras rutas
  return NextResponse.next();
}

// Configurar las rutas en las que el middleware debe ejecutarse
export const config = {
  matcher: [
    // Incluir todas las rutas excepto assets estáticos
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
