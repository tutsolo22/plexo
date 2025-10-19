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

        if (!user) {
          return null;
        }

        // Verificar contraseña con bcrypt
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Retornar usuario sin la contraseña
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;

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
        token['role'] = (user as any).role;
        token['id'] = ((user as any).id || '') as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token['id'] as string;
        (session.user as any).role = (token['role'] as unknown) as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default authConfig;
