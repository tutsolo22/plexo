import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Proxy entrypoint (Next 16 recommended replacement for middleware).
 *
 * Esta función se usará para aplicar cabeceras de seguridad globales y
 * comportamientos ligeros a las peticiones entrantes sin usar la convención
 * legacy de `middleware`.
 */
export async function proxy(request: NextRequest) {
  // Forzar HTTPS en producción si hace falta
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol;
    if (proto && !proto.toString().startsWith('https')) {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      const redirect = NextResponse.redirect(httpsUrl);
      redirect.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      return redirect;
    }
  }

  const res = NextResponse.next();
  // Cabeceras de seguridad ligeras
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', "geolocation=(), microphone=(), camera=()");

  return res;
}

export const config = {
  // Aplicar a la mayoría de rutas públicas no estáticas; las rutas /api mantienen
  // su propio CORS/headers configurado en next.config.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
};
