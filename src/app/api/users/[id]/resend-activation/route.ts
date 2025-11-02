import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/auth/password'
import { EmailService } from '@/lib/email/email-service'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Solo admins pueden reenviar para otros usuarios
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 })
    }

    const userId = params.id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })

    // Si el usuario pertenece a otro tenant y llamador no es SUPER_ADMIN, bloquear
    if (session.user.role !== 'SUPER_ADMIN' && user.tenantId !== session.user.tenantId) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 })
    }

    const token = generateVerificationToken()
    await prisma.user.update({ where: { id: userId }, data: { activationCode: token } })

    const emailService = new EmailService()
  const activationLink = `${process.env['NEXTAUTH_URL'] || ''}/auth/activate?token=${token}`
  const subject = 'Activación de cuenta - Gestión de Eventos'
  const html = `<p>Hola ${user.name || ''},</p><p>Para activar tu cuenta haz clic en el siguiente enlace:</p><p><a href="${activationLink}">Activar cuenta</a></p>`
  await emailService.sendEmail({ to: user.email, subject, html, tenantId: user.tenantId }).catch(e => console.error(e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in resend activation by admin:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
