import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

type Props = {
  children: ReactNode;
};

export default async function Layout({ children }: Props) {
  // Obtener sesión directamente con auth()
  const session = await auth();

  // No autenticado -> redirigir a login con callback
  if (!session || !session.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard')}`);
  }

  // Comprobar rol mínimo
  const role = (session.user as any)?.role as string | undefined;
  const allowed = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER'];
  if (!role || !allowed.includes(role)) {
    redirect('/auth/signin');
  }

  // Renderizar el layout cliente que contiene la barra lateral / navegación.
  return <DashboardLayout>{children}</DashboardLayout>;
}
