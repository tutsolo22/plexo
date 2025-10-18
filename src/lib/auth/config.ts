import NextAuth from 'next-auth'
type NextAuthOptions = Parameters<typeof NextAuth>[0]
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { UserRole } from '@prisma/client'
import type { Adapter } from 'next-auth/adapters'
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

          // Validar que el tenant esté activo
          if (!user.tenant?.isActive) {
            throw new Error('La organización está inactiva. Contacta al administrador.')
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
            tenantId: user.tenantId,
            tenantName: user.tenant?.name || '',
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

  // Configuración de JWT
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Callbacks para personalizar sesión y JWT
  callbacks: {
    /**
     * Callback JWT - Ejecutado cuando se crea/actualiza el token
     */
    async jwt({ token, user }: { token: any; user: any }) {
      // Si es el primer login, agregar datos del usuario al token
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantName = user.tenantName
        token.emailVerified = user.emailVerified
      }
      return token
    },

    /**
     * Callback Session - Ejecutado cuando se accede a la sesión
     */
    async session({ session, token }: { session: any; token: any }) {
      // Agregar datos adicionales a la sesión
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.tenantId = token.tenantId as string
        session.user.tenantName = token.tenantName as string
        session.user.emailVerified = token.emailVerified as Date | null
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
    async signIn({ user, account, profile, isNewUser }: { user: any; account: any; profile: any; isNewUser: any }) {
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

    async signOut({ session, token }: { session: any; token: any }) {
      // Log de cierre de sesión
      if (token?.sub) {
        const userData = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { tenantId: true }
        });
        
        await prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            tableName: 'User',
            recordId: token.sub,
            newData: { action: `Usuario cerró sesión` },
            userId: token.sub,
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