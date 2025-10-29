import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UsersClient from '@/components/users/UsersClient'
import { LegacyUserRole } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Usuarios | Gestión de Eventos',
  description: 'Gestión de usuarios del sistema',
}

export default async function UsersPage() {
  const session = await auth()

  // Si no autenticado, redirigir a login
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Requerir verificación de correo: si no está verificado, enviar al flujo de verificación
  if (!session.user.emailVerified) {
    redirect('/auth/verify-request')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600 mt-2">Aquí puedes ver y administrar los usuarios de la plataforma.</p>
        </div>
        <div>
          <Link href="/dashboard/users/new" className="inline-flex items-center rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
            Crear usuario
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {/* Clientside users table with pagination and filtering */}
        <UsersClient />
      </div>
    </div>
  )
}
