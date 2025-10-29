import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para usuarios
const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  // password is optional for admin-created users; activation flow will handle setting password
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: z
    .enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER', 'CLIENT_EXTERNAL'])
    .default('USER'),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

// const updateUserSchema = z.object({
//   name: z.string().min(1, 'El nombre es requerido').optional(),
//   email: z.string().email('Email inválido').optional(),
//   password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
//   role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER', 'CLIENT_EXTERNAL']).optional(),
//   phone: z.string().optional(),
//   isActive: z.boolean().optional()
// }) // Para uso futuro

// GET /api/users - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo ciertos roles pueden listar usuarios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Record<string, unknown> = {};

    // SUPER_ADMIN ve todos los usuarios, otros solo los de su tenant
    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN') {
      where['tenantId'] = (session.user as any).tenantId;
    }

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where['role'] = role;
    if (isActive !== null) where['isActive'] = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          _count: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/users - Crear usuario
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo ciertos roles pueden crear usuarios
    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Verificar email único
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      );
    }

    // Validar permisos de rol
    if (userRole === 'TENANT_ADMIN') {
      // TENANT_ADMIN no puede crear SUPER_ADMIN
      if (validatedData.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'No puedes crear usuarios SUPER_ADMIN' },
          { status: 403 }
        );
      }
    }

    // Hash de la contraseña si fue proporcionada
    const { hashPassword, generateVerificationToken } = await import('@/lib/auth/password');
    let hashedPassword = null
    let activationCode = null
    if (validatedData.password) {
      hashedPassword = await hashPassword(validatedData.password)
    } else {
      // generar token de activación para que el usuario cree su contraseña por correo
      activationCode = generateVerificationToken()
    }

    // Determinar tenant
    let tenantId = (session.user as any).tenantId || null;
    if (userRole === 'SUPER_ADMIN' && validatedData.role === 'SUPER_ADMIN') {
      tenantId = null; // SUPER_ADMIN puede no pertenecer a un tenant específico
    }

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        isActive: validatedData.isActive,
        tenantId,
        // Si la creación la hace admin y no se proporcionó password, no marcar como verificado
        emailVerified: hashedPassword ? new Date() : null,
        activationCode: activationCode
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    // Si no se proporcionó contraseña, enviar email de activación para crear contraseña
    if (!validatedData.password && activationCode) {
      try {
        const emailService = new (await import('@/lib/email/email-service')).EmailService()
        const activationLink = `${process.env['NEXTAUTH_URL'] || ''}/auth/activate?token=${activationCode}`
        const subject = 'Activación de cuenta - Gestión de Eventos'
        const html = `<p>Hola ${user.name || ''},</p><p>Para activar tu cuenta y crear tu contraseña haz clic en el siguiente enlace:</p><p><a href="${activationLink}">Activar cuenta</a></p>`
        await emailService.sendEmail({ to: user.email, subject, html, tenantId: user.tenant?.id }).catch(e => console.error(e))
      } catch (e) {
        console.error('Error enviando email de activación:', e)
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'Usuario creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
