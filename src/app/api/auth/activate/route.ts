import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = String(body.token || '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where: { activationCode: token } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 400 })
    }

    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date(), activationCode: null } })

    return NextResponse.json({ success: true, message: 'Cuenta activada correctamente' })
  } catch (error) {
    console.error('Error activating account:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
