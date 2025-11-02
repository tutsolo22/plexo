import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const userId = params.id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })

    // Solo admins pueden togglear (y con tenant-scope)
    if (session.user.role !== 'SUPER_ADMIN' && user.tenantId !== session.user.tenantId) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 })
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } })
    return NextResponse.json({ success: true, data: { isActive: updated.isActive } })
  } catch (error) {
    console.error('Error toggling activation:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
