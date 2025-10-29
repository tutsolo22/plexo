import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import APIKeyTestPanel from '@/components/ai/APIKeyTestPanel';
import { hasRoleAccess } from '@/lib/auth/permissions';
import { LegacyUserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Panel de Verificación de API Keys | Gestión de Eventos',
  description: 'Verifica y prueba las claves de API de proveedores de IA',
};

export default async function AITestPage() {
  const session = await auth();
  
  // Verificar autenticación
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Solo usuarios con jerarquía de MANAGER o superior pueden acceder (incluye TENANT_ADMIN y SUPER_ADMIN)
  if (!hasRoleAccess(session.user.role as LegacyUserRole, LegacyUserRole.MANAGER)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <APIKeyTestPanel />
    </div>
  );
}