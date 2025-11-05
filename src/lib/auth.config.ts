import { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Buscar usuario en la base de datos
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        console.log('[auth] authorize called for', credentials.email);

        if (!user) {
          return null;
        }

        // Verificar contraseña con bcrypt
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Retornar usuario sin la contraseña
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        console.log('[auth] authorize success for', user.email, 'id=', user.id);
        return userWithoutPassword;
      },
    }),
  ],
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
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let NextAuth handle domain
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token['role'] = (user as any).role;
        token['id'] = ((user as any).id || '') as string;
        // Incluir estado de verificación de correo en el token para poder verificarlo en layouts/server pages
        // Serializamos a string si es Date
        const emailVerified = (user as any).emailVerified;
        if (emailVerified) {
          try {
            ;(token as any)['emailVerified'] = typeof emailVerified === 'string' ? emailVerified : (emailVerified as Date).toISOString();
          } catch (e) {
            ;(token as any)['emailVerified'] = String(emailVerified);
          }
        } else {
          ;(token as any)['emailVerified'] = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token['id'] as string;
        (session.user as any).role = token['role'] as unknown as string;
        // Transferir emailVerified al objeto session.user (se mantiene como string ISO o null)
        if (typeof (token as any)['emailVerified'] === 'string') {
          try {
            (session.user as any).emailVerified = new Date((token as any)['emailVerified']);
          } catch (e) {
            (session.user as any).emailVerified = (token as any)['emailVerified'];
          }
        } else {
          (session.user as any).emailVerified = (token as any)['emailVerified'] ?? null;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default authConfig;
