import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configurar transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // No revelar si el email existe o no por seguridad
    if (!user) {
      return NextResponse.json(
        { message: 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña' },
        { status: 200 }
      );
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token en base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    // Construir URL de recuperación
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Enviar email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Recupera tu contraseña de Plexo',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #333; margin-bottom: 20px;">Recupera tu contraseña</h1>
            
            <p style="color: #666; margin-bottom: 15px;">
              Hola ${user.name || 'Usuario'},
            </p>
            
            <p style="color: #666; margin-bottom: 20px;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en Plexo. 
              Haz clic en el botón de abajo para crear una nueva contraseña.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Restablecer Contraseña
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Si no solicitaste este cambio, puedes ignorar este correo. El enlace expirará en 24 horas.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              O copia este enlace en tu navegador: ${resetUrl}
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
