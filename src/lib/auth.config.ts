import { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Por ahora, permitir login con credenciales de ejemplo
        // En producción, aquí iría la verificación real con bcrypt
        if (
          credentials.email === 'admin@gestioneventos.com' &&
          credentials.password === 'admin123'
        ) {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });
          return user;
        }

        if (
          credentials.email === 'manager@gestioneventos.com' &&
          credentials.password === 'manager123'
        ) {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });
          return user;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default authConfig;
