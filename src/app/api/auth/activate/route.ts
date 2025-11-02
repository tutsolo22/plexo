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

    if (!password) {
      return NextResponse.json({ success: false, error: 'Contraseña requerida' }, { status: 400 })
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where: { activationCode: token } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 400 })
    }

    // Hash de la contraseña y activación de cuenta
    const { hashPassword } = await import('@/lib/auth/password')
    const hashed = await hashPassword(password)
    
    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { 
        emailVerified: new Date(), 
        activationCode: null, 
        password: hashed,
        isActive: true // Asegurar que esté activo
      } 
    })

    console.log('✅ Usuario activado:', user.id, 'Email verificado y contraseña establecida')

    return NextResponse.json({ success: true, message: 'Cuenta activada y contraseña establecida correctamente' })
  } catch (error) {
    console.error('Error activating account:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

// GET /api/auth/activate?token=... -> valida token y devuelve información del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = String(searchParams.get('token') || '')
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ 
      where: { activationCode: token }, 
      select: { 
        id: true, 
        email: true, 
        name: true,
        password: true 
      } 
    })
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 400 })
    }

    // Siempre necesita establecer contraseña en el proceso de activación
    return NextResponse.json({ 
      success: true, 
      data: { 
        email: user.email,
        name: user.name,
        needsPassword: true // Siempre requiere crear contraseña
      } 
    })
  } catch (error) {
    console.error('Error validating activation token:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
