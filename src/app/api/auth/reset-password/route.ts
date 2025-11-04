import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    // Validar inputs
    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Enlace inválido o expirado' },
        { status: 400 }
      );
    }

    // Validar token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (user.resetToken !== tokenHash) {
      return NextResponse.json(
        { error: 'Enlace inválido' },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Enlace expirado. Por favor solicita uno nuevo' },
        { status: 400 }
      );
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Actualizar contraseña y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json(
      { message: 'Contraseña restablecida exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    );
  }
}
