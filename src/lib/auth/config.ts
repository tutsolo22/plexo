import NextAuth, { type User, type Account, type Profile, type Session } from 'next-auth'
type NextAuthOptions = Parameters<typeof NextAuth>[0]
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'
import type { Adapter, AdapterSession, AdapterUser } from 'next-auth/adapters'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { LegacyUserRole as UserRole } from '@prisma/client'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate Limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per 1 minute
  analytics: true,
  prefix: '@upstash/ratelimit',
});


/**
 * Configuración de NextAuth.js para CRM Casona María
 * 
 * Características implementadas:
 * - Autenticación por credenciales (email/password)
 * - Integración con Prisma y PostgreSQL
 * - Sistema de roles jerárquicos
 * - Sesiones JWT seguras
 * - Verificación de email obligatoria
 */
export const authOptions: NextAuthOptions = {
  // Configuración del adaptador de Prisma
  adapter: PrismaAdapter(prisma) as Adapter,
  
  // Proveedores de autenticación
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'tu@email.com'
        },
        password: { 
          label: 'Contraseña', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (process.env['UPSTASH_REDIS_REST_URL']) {
          const identifier = (credentials?.email || 'unknown') as string;
          const { success } = await ratelimit.limit(identifier);
          if (!success) {
            throw new Error('Demasiados intentos de inicio de sesión. Inténtalo de nuevo en un minuto.');
          }
        }
        // Validación de entrada
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        try {
          // Buscar usuario por email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  isActive: true
                }
              }
            }
          })

          // Validar existencia del usuario
          if (!user) {
            throw new Error('Credenciales inválidas')
          }

          // Validar que el usuario esté activo
          if (!user.isActive) {
            throw new Error('Tu cuenta está inactiva. Contacta al administrador.')
          }

          // Validar que el tenant esté activo (solo si NO es SUPER_ADMIN)
          if (user.role !== 'SUPER_ADMIN') {
            if (!user.tenant) {
              throw new Error('Usuario sin organización asignada. Contacta al administrador.')
            }
            if (!user.tenant.isActive) {
              throw new Error('La organización está inactiva. Contacta al administrador.')
            }
          }

          // Validar email verificado (solo para usuarios no SUPER_ADMIN)
          if (!user.emailVerified && user.role !== 'SUPER_ADMIN') {
            throw new Error('Debes verificar tu email antes de iniciar sesión')
          }

          // Verificar contraseña
          if (!user.password) {
            throw new Error('Usuario sin contraseña configurada')
          }
          
          const isValidPassword = await verifyPassword(
            credentials.password as string, 
            user.password
          )

          if (!isValidPassword) {
            throw new Error('Credenciales inválidas')
          }

          // Retornar datos del usuario para la sesión
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId || null, // SUPER_ADMIN puede no tener tenant
            tenantName: user.tenant?.name || null,
            emailVerified: user.emailVerified
          }
        } catch (error) {
          console.error('Error en autorización:', error)
          throw error
        }
      }
    })
  ],

  // Configuración de sesión
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Configuración de sesión
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas (86400 segundos)
    updateAge: 60 * 60, // Actualizar sesión cada 1 hora
  },

  // Configuración de cookies
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: undefined, // Cookie de sesión - expira al cerrar navegador
      },
    },
  },

  // Configuración de JWT
  jwt: {
    maxAge: 24 * 60 * 60, // 24 horas
  },

  // Callbacks para personalizar sesión y JWT
  callbacks: {
    /**
     * Callback JWT - Ejecutado cuando se crea/actualiza el token
     */
    async jwt({ token, user }: { token: JWT; user?: User | AdapterUser }) {
      // Si es el primer login, agregar datos del usuario al token
      if (user) {
        const extendedUser = user as User & {
          role: UserRole;
          tenantId: string | null; // SUPER_ADMIN puede no tener tenant
          tenantName: string | null;
          emailVerified: Date | null;
        };
        token.role = extendedUser.role
        token.tenantId = extendedUser.tenantId || null
        token.tenantName = extendedUser.tenantName || null
        token.emailVerified = extendedUser.emailVerified
      }
      return token
    },

    /**
     * Callback Session - Ejecutado cuando se accede a la sesión
     */
    async session({ session, token }: { session: Session; token: JWT }) {
      // Agregar datos adicionales a la sesión
      if (token) {
        const extendedSession = session as Session & {
          user: User & {
            role: UserRole;
            tenantId: string | null; // SUPER_ADMIN puede no tener tenant
            tenantName: string | null;
            emailVerified: Date | null;
          };
        };
        extendedSession.user.id = token.sub!
        extendedSession.user.role = token.role as UserRole
        extendedSession.user.tenantId = (token.tenantId as string | null) || null
        extendedSession.user.tenantName = (token.tenantName as string | null) || null
        extendedSession.user.emailVerified = (token.emailVerified as Date | null | undefined) ?? null
      }
      return session
    },

    /**
     * Callback de redirección después del login
     */
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Si la URL es relativa, agregar baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Si la URL pertenece al mismo dominio, permitir
      if (new URL(url).origin === baseUrl) {
        return url
      }
      // Por defecto, redirigir al dashboard
      return `${baseUrl}/dashboard`
    }
  },

  // Páginas personalizadas
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  // Configuración de eventos para auditoría
  events: {
    async signIn({ user, account, profile: _profile, isNewUser: _isNewUser }: { 
      user: User; 
      account: Account | null; 
      profile?: Profile; 
      isNewUser?: boolean; 
    }) {
      // Log de inicio de sesión exitoso
      if (user.id) {
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tenantId: true }
        });
        
        await prisma.auditLog.create({
          data: {
            action: 'LOGIN',
            tableName: 'User',
            recordId: user.id,
            newData: {
              action: `Usuario ${user.email} inició sesión`,
              provider: account?.provider,
              ip: '0.0.0.0' // TODO: Obtener IP real del request
            },
            userId: user.id,
            tenantId: userData?.tenantId || ''
          }
        }).catch((error: unknown) => {
          console.error('Error logging signIn event:', error)
        })
      }
    },

    async signOut(message: { session: void | AdapterSession | null } | { token: JWT | null }) {
      // Log de cierre de sesión
      let userId: string | undefined;
      
      if ('token' in message && message.token?.sub) {
        userId = message.token.sub;
      } else if ('session' in message && message.session && typeof message.session === 'object' && 'userId' in message.session) {
        userId = message.session.userId;
      }
      
      if (userId) {
        const userData = await prisma.user.findUnique({
          where: { id: userId },
          select: { tenantId: true }
        });
        
        await prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            tableName: 'User',
            recordId: userId,
            newData: { action: `Usuario cerró sesión` },
            userId: userId,
            tenantId: userData?.tenantId || ''
          }
        }).catch((error: unknown) => {
          console.error('Error logging signOut event:', error)
        })
      }
    }
  },

  // Configuración de debug (solo en desarrollo)
  debug: process.env.NODE_ENV === 'development'
}