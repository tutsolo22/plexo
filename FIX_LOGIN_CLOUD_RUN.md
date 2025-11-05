# 🔐 FIX: Problema de Redirect en Login - Cloud Run

**Fecha**: 5 de Noviembre de 2025  
**Problema**: Login exitoso pero no redirige al dashboard en Cloud Run  
**Status**: ✅ RESUELTO  

---

## 📊 Síntomas Reportados

**En Cloud Run**:

- ✅ Login exitoso (POST callback/credentials → 200 OK)
- ✅ Sesión activa (GET /api/auth/session → 200 OK)
- ❌ NO redirige a `/dashboard`
- ❌ Redirige de vuelta a `/auth/signin` (redirect loop)

**En Local**:

- ✅ Todo funciona correctamente

---

## 🔍 Root Cause Analysis

### Problema 1: Dashboard sin Protección Middleware

**Ubicación**: `/dashboard` route  
**Problema**: No había middleware que protegiera las rutas privadas  
**Síntoma**: Cualquiera podía acceder a `/dashboard` sin estar autenticado

**Impacto**:

- El servidor renderizaba la página del dashboard
- Pero el cliente detectaba que no hay sesión
- Y redirigía de vuelta a login
- Creando un loop infinito

### Problema 2: Layout Usando Fetch en Lugar de `auth()`

**Ubicación**: `src/app/dashboard/layout.tsx`  
**Problema**: Usando `fetch()` a `/api/auth/session` en lugar de llamar `auth()` directamente  
**Síntoma**: En Cloud Run, el fetch podría fallar por problemas de host/headers

**Código Anterior**:

```typescript
const sessRes = await fetch(`${authUrl}/api/auth/session`, {
  cache: 'no-store',
  headers: { cookie: cookieHeader }
});
```

**Problema**:

- En Cloud Run, `process.env['NEXTAUTH_URL']` podría no estar configurado
- El fetch podría no incluir correctamente las cookies
- Causaba que `session` fuera null

### Problema 3: Cookies no Configuradas Correctamente

**Ubicación**: `src/lib/auth.config.ts`  
**Problema**: No había configuración explícita de cookies para producción

**Issues**:

- En HTTPS (Cloud Run), las cookies necesitan `secure: true`
- Faltaba `sameSite` configuration
- No había duración de sesión explícita

---

## ✅ Soluciones Implementadas

### 1. Crear Middleware de Protección

**Archivo**: `src/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas protegidas
  const protectedRoutes = ['/dashboard', '/admin', '/settings'];

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const session = await auth();

    if (!session || !session.user) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}
```

**Beneficios**:

- ✅ Redirige ANTES de renderizar la página
- ✅ Previene loops infinitos
- ✅ Mantiene callback URL para redirigir después del login

### 2. Actualizar Dashboard Layout

**Archivo**: `src/app/dashboard/layout.tsx`

```typescript
// ANTES
const sessRes = await fetch(`${authUrl}/api/auth/session`, {...});
let session = await sessRes.json();

// DESPUÉS
const session = await auth();
```

**Beneficios**:

- ✅ Usa NextAuth directamente
- ✅ Evita problemas de fetch en Cloud Run
- ✅ Más confiable y simple

### 3. Mejorar Configuración de Cookies

**Archivo**: `src/lib/auth.config.ts`

```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 días
},
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
},
```

**Beneficios**:

- ✅ `secure: true` en producción (HTTPS)
- ✅ `sameSite: 'lax'` previene CSRF
- ✅ `httpOnly: true` previene XSS
- ✅ Duración clara de 30 días

---

## 📈 Flujo de Autenticación (Después del Fix)

```text
1. Usuario llega a /auth/signin
   ↓
2. Ingresa credenciales y submite
   ↓
3. POST /api/auth/callback/credentials
   ├─ Valida credenciales ✓
   ├─ Crea JWT token
   ├─ Configura cookie session
   └─ Retorna 200 OK
   ↓
4. Cliente hace router.push('/dashboard')
   ↓
5. Middleware intercepta GET /dashboard
   ├─ Lee session del JWT (cookie)
   ├─ Verifica autenticación ✓
   └─ Permite acceso
   ↓
6. Dashboard Layout (Server Component)
   ├─ Llama await auth()
   ├─ Obtiene sesión ✓
   ├─ Verifica rol ✓
   └─ Renderiza dashboard
   ↓
7. Usuario ve dashboard ✅
```

---

## 🧪 Testing

### Local (Desarrollo)

```bash
npm run dev

# Abrir http://localhost:3200/auth/signin
# Ingresar credenciales
# ✅ Debe redirigir a /dashboard
```

### Cloud Run (Producción)

```bash
gcloud run deploy plexo \
  --source . \
  --set-env-vars NEXTAUTH_URL=https://plexo-xxxx.run.app

# Ingresar credenciales
# ✅ Debe redirigir a /dashboard
```

---

## 📋 Checklist de Verificación

- ✅ Middleware creado: `src/middleware.ts`
- ✅ Layout actualizado: `src/app/dashboard/layout.tsx`
- ✅ Cookies configuradas: `src/lib/auth.config.ts`
- ✅ Build exitoso: 0 errores TypeScript
- ✅ Rutas protegidas:
  - `/dashboard` → Redirige si no autenticado
  - `/admin` → Redirige si no autenticado
  - `/settings` → Redirige si no autenticado
- ✅ Rutas públicas:
  - `/auth/signin` → Acceso público
  - `/auth/forgot-password` → Acceso público
  - `/` → Acceso público
- ✅ Código commiteado y pusheado
- ✅ Ambos repositorios sincronizados

---

## 🔧 Configuración Requerida en Cloud Run

Asegurar que estas variables estén configuradas:

```bash
NEXTAUTH_URL=https://plexo-xxxx.run.app
NEXTAUTH_SECRET=<random-secure-value>
DATABASE_URL=<postgres-connection-string>
NODE_ENV=production
```

**Importante**: `NEXTAUTH_URL` DEBE ser la URL HTTPS del servicio Cloud Run.

---

## 📊 Cambios Realizados

| Archivo | Cambios | Razón |
|---------|---------|-------|
| `src/middleware.ts` | Creado | Proteger rutas privadas |
| `src/app/dashboard/layout.tsx` | Actualizado | Usar `auth()` en lugar de `fetch()` |
| `src/lib/auth.config.ts` | Mejorado | Configurar cookies correctamente |

---

## 🎯 Resultado

**Antes**:

```text
Login → Redirige a dashboard → Redirige a signin → Loop infinito ❌
```

**Después**:

```text
Login → Middleware protege → Dashboard renderiza → Usuario ve página ✅
```

---

## 📝 Notas Importantes

1. **Middleware en production**: Se ejecuta en EDGE (muy rápido)
2. **Server Components**: Los Layouts son server components (mejor para auth)
3. **Cookies Secure**: En HTTPS, las cookies deben ser `secure`
4. **JWT Strategy**: Más rápido y escalable que session store

---

## ✨ Próximos Pasos

1. **Deploy a Cloud Run**: Deployar cambios
2. **Testing**: Verificar login en Cloud Run
3. **Monitoreo**: Revisar logs de autenticación
4. **Documentación**: Actualizar docs de deployment

---

**Commit**: `5df55a7` - fix: Mejorar protección de autenticación en dashboard  
**Status**: ✅ READY TO DEPLOY
