import { redirect } from 'next/navigation';import { Metadata } from 'next'

import ResourcesClient from '@/components/resources/ResourcesClient'

export default function ResourcesPage() {import { auth } from '@/lib/auth'

  // Redirigir a la nueva ubicación de configuracionesimport { redirect } from 'next/navigation'

  redirect('/dashboard/settings');

}export const metadata: Metadata = {

  title: 'Recursos | Gestión de Eventos',
  description: 'Gestión de recursos y configuraciones del sistema',
}

export default async function ResourcesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Solo TENANT_ADMIN y usuarios regulares requieren verificación
  // SUPER_ADMIN puede acceder sin verificación
  if (session.user.role !== 'SUPER_ADMIN' && !session.user.emailVerified) {
    redirect('/auth/verify-request')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Recursos</h1>
      <p className="text-sm text-gray-600 mt-2">Gestión de recursos, archivos y configuraciones del sistema.</p>

      <div className="mt-6">
        {/* Client component to manage tenant-specific configurations like WhatsApp and MercadoPago */}
        <div className="rounded border bg-card p-6 shadow-sm">
          <ResourcesClient />
        </div>
      </div>
    </div>
  )
}
