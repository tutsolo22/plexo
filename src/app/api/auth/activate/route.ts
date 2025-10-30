import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = String(body.token || '')
    const password = body.password as string | undefined
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where: { activationCode: token } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 400 })
    }

    // Si se envía password, la guardamos (hash) y activamos la cuenta
    if (password) {
      const { hashPassword } = await import('@/lib/auth/password')
      const hashed = await hashPassword(password)
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date(), activationCode: null, password: hashed } })
      return NextResponse.json({ success: true, message: 'Cuenta activada y contraseña establecida' })
    }

    // Si no hay password, solo marcamos emailVerified (flujo de verificación simple)
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date(), activationCode: null } })

    return NextResponse.json({ success: true, message: 'Cuenta activada correctamente' })
  } catch (error) {
    console.error('Error activating account:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

// GET /api/auth/activate?token=... -> valida token y devuelve si se necesita crear contraseña
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = String(searchParams.get('token') || '')
    if (!token) return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 })

    const user = await prisma.user.findFirst({ where: { activationCode: token }, select: { id: true, email: true, password: true } })
    if (!user) return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 400 })

    // Si el usuario no tiene password, necesita establecerla
    const needsPassword = !user.password

    return NextResponse.json({ success: true, data: { needsPassword } })
  } catch (error) {
    console.error('Error validating activation token:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
