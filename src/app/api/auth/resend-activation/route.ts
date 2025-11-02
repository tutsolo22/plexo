import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/auth/password'
import { EmailService } from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email || '')
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // No revelar si existe o no por seguridad
      return NextResponse.json({ success: true })
    }

    // Generar y guardar código de activación
    const token = generateVerificationToken()
    await prisma.user.update({ where: { id: user.id }, data: { activationCode: token } })

    // Enviar email con enlace de activación
    const emailService = new EmailService()
    const activationLink = `${process.env['NEXTAUTH_URL'] || ''}/auth/activate?token=${token}`
    const subject = 'Activación de cuenta - Gestión de Eventos'
    const html = `<p>Hola ${user.name || ''},</p><p>Para activar tu cuenta haz clic en el siguiente enlace:</p><p><a href="${activationLink}">Activar cuenta</a></p>`
    await emailService.sendEmail({ to: user.email, subject, html, tenantId: user.tenantId }).catch((err) => {
      console.error('Error sending activation email:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in resend activation API:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
