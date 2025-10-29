import { ReactNode } from 'react';
// Usamos fetch al endpoint de sesión en lugar de `auth()` para evitar
// incompatibilidades con la versión beta de next-auth en App Router.
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import authConfig from '@/lib/auth.config';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

type Props = {
  children: ReactNode;
};

export default async function Layout({ children }: Props) {
  const authUrl = process.env['NEXTAUTH_URL'] || 'http://localhost:3200';

  // Forward incoming request cookies to the internal session endpoint so
  // the server-side fetch can validate the session for the current user.
  // Use the `cookies()` helper which provides a stable API across runtimes.
  // `cookies()` is async in Next 16; await it before accessing getAll().
  const cookieStore = await cookies();
  const cookieList = cookieStore.getAll?.() || [];
  const cookieHeader = cookieList.map((c: any) => `${c.name}=${c.value}`).join('; ');
  const sessRes = await fetch(`${authUrl}/api/auth/session`, {
    cache: 'no-store',
    // Pasamos la cookie para que NextAuth pueda leer la sesión JWT
    headers: {
      cookie: cookieHeader,
    },
  });

  let session: any = null;
  try {
    if (sessRes.ok) session = await sessRes.json();
  } catch (e) {
    session = null;
  }

  // No autenticado -> redirigir a login con callback
  if (!session) {
    // La ruta de inicio de sesión en la app es /auth/signin
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard')}`);
  }

  // Comprobar rol mínimo
  const role = (session?.user as any)?.role as string | undefined;
  const allowed = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER'];
  if (!role || !allowed.includes(role)) {
    redirect('/auth/signin');
  }

  // Si SUPER_ADMIN entra a /dashboard raíz, lo dejamos al frontend o middleware para redireccionar
  // Renderizamos el layout cliente que contiene la barra lateral / navegación.
  return <DashboardLayout>{children}</DashboardLayout>;
}
