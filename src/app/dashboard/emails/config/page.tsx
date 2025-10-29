import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EmailConfiguration from '@/components/emails/EmailConfiguration'

export const metadata: Metadata = {
  title: 'Emails | Gestión de Eventos',
  description: 'Configuración de envío de correos SMTP',
}

export default async function EmailConfigPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')
  // Allow SUPER_ADMIN (seeded) to access regardless of email verification.
  // Other roles must have verified email.
  const role = session.user.role as string
  const isSuper = role === 'SUPER_ADMIN'
  if (!isSuper && !session.user.emailVerified) {
    redirect('/auth/verify-request')
  }

  // Only admin roles should access this page (TENANT_ADMIN+ or SUPER_ADMIN)
  if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'].includes(role)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-8">
      <EmailConfiguration />
    </div>
  )
}