import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import APIKeyTestPanel from '@/components/ai/APIKeyTestPanel';

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

  // Solo admins pueden acceder a este panel
  if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <APIKeyTestPanel />
    </div>
  );
}