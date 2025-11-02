import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Usuario | Gestión de Eventos',
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true, tenantId: true } })
  if (!user) return <div className="container mx-auto py-8">Usuario no encontrado</div>

  // Tenant scoping
  if (session.user.role !== 'SUPER_ADMIN' && user.tenantId !== session.user.tenantId) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Usuario: {user.name ?? user.email}</h1>
      <div className="mt-4">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Rol:</strong> {String(user.role)}</p>
        <p><strong>Activo:</strong> {user.isActive ? 'Sí' : 'No'}</p>
        <p><strong>Email verificado:</strong> {user.emailVerified ? 'Sí' : 'No'}</p>
      </div>
      <div className="mt-6">
        {/* Edición avanzada puede implementarse aquí (formularios) */}
      </div>
    </div>
  )
}
