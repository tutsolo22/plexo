import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para usuarios
const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  // password NO se usa en creación - el usuario la establece al activar su cuenta
  password: z.string().optional(), // Ignorado, solo por compatibilidad
  role: z
    .enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER', 'CLIENT_EXTERNAL'])
    .default('USER'),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
  // Campos opcionales para tenant (solo usados al crear TENANT_ADMIN)
  tenantId: z.string().optional(), // Si se proporciona, se usa ese tenant existente
  tenantName: z.string().optional(), // Si se proporciona, se usa este nombre para el tenant auto-creado
  tenantDomain: z.string().optional(), // Si se proporciona, se usa este dominio para el tenant auto-creado
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

    // Hash de la contraseña si fue proporcionada (NO guardar, solo para validación futura)
    const { generateVerificationToken } = await import('@/lib/auth/password');
    
    // Siempre generar token de activación para verificación de email
    // No guardar password hasta que el usuario active su cuenta
    const activationCode = generateVerificationToken()

    // Determinar tenant según rol y permisos
    // LÓGICA DE MULTI-TENANCY:
    // 1. SUPER_ADMIN: NO tiene tenantId (gestiona toda la plataforma)
    //    - Puede crear otros SUPER_ADMIN (sin tenant)
    //    - Puede crear TENANT_ADMIN (se crea automáticamente un nuevo tenant)
    // 2. TENANT_ADMIN: SÍ tiene tenantId (gestiona SU organización)
    //    - Crea MANAGER/USER automáticamente en SU tenant
    // 3. MANAGER: SÍ tiene tenantId (pertenece a organización)
    //    - Crea USER automáticamente en SU tenant
    
    let tenantId: string | null = null;
    const userTenantId = (session.user as any).tenantId;
    
    if (validatedData.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN nunca tiene tenantId
      tenantId = null;
      
      // Solo SUPER_ADMIN puede crear otros SUPER_ADMIN
      if (userRole !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Solo SUPER_ADMIN puede crear otros SUPER_ADMIN' },
          { status: 403 }
        );
      }
    } else if (validatedData.role === 'TENANT_ADMIN') {
      // TENANT_ADMIN requiere tenantId
      
      if (userRole === 'SUPER_ADMIN') {
        // SUPER_ADMIN creando TENANT_ADMIN: crear automáticamente un nuevo tenant
        
        // Validar que se proporcione información del tenant
        if (!validatedData.tenantId) {
          // Si no se proporciona tenantId, se crea un nuevo tenant automáticamente
          // Prioridad: 1) tenantName/tenantDomain proporcionados, 2) derivados del usuario
          
          const tenantName = validatedData.tenantName || validatedData.name || validatedData.email.split('@')[0];
          
          // Generar dominio único
          let baseDomain = validatedData.tenantDomain || 
                          validatedData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
          let domain = baseDomain;
          let counter = 1;
          
          // Verificar que el dominio sea único
          while (await prisma.tenant.findFirst({ where: { domain } })) {
            domain = `${baseDomain}-${counter}`;
            counter++;
          }
          
          // Crear el nuevo tenant
          const newTenant = await prisma.tenant.create({
            data: {
              name: tenantName,
              domain: domain,
              isActive: true
            }
          });
          
          tenantId = newTenant.id;
          
          console.log('✅ Tenant creado automáticamente:', newTenant.id, 'Nombre:', newTenant.name, 'Dominio:', newTenant.domain);
        } else {
          // Si se proporciona tenantId, usar ese tenant existente
          tenantId = validatedData.tenantId;
          
          // Validar que el tenant existe y está activo
          const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, isActive: true, name: true }
          });
          
          if (!tenant) {
            return NextResponse.json(
              { success: false, error: 'El tenant especificado no existe' },
              { status: 400 }
            );
          }
          
          if (!tenant.isActive) {
            return NextResponse.json(
              { success: false, error: 'El tenant especificado no está activo' },
              { status: 400 }
            );
          }
        }
      } else {
        // Solo SUPER_ADMIN puede crear TENANT_ADMIN
        return NextResponse.json(
          { success: false, error: 'Solo SUPER_ADMIN puede crear TENANT_ADMIN' },
          { status: 403 }
        );
      }
    } else {
      // MANAGER, USER, CLIENT_EXTERNAL: heredan el tenant del usuario que los crea
      
      if (userRole === 'SUPER_ADMIN') {
        // SUPER_ADMIN no puede crear estos roles directamente (no tiene tenant)
        return NextResponse.json(
          { 
            success: false, 
            error: 'SUPER_ADMIN no puede crear usuarios de tipo MANAGER/USER. Estos roles deben ser creados por TENANT_ADMIN o MANAGER dentro de su organización.' 
          },
          { status: 403 }
        );
      }
      
      // TENANT_ADMIN o MANAGER creando usuarios en SU tenant
      if (!userTenantId) {
        return NextResponse.json(
          { success: false, error: 'Usuario sin tenant asociado no puede crear usuarios de organización' },
          { status: 400 }
        );
      }
      
      tenantId = userTenantId; // Heredar tenant del creador
      
      // Validar permisos según rol
      if (validatedData.role === 'MANAGER' && !['TENANT_ADMIN'].includes(userRole)) {
        return NextResponse.json(
          { success: false, error: 'Solo TENANT_ADMIN puede crear MANAGER' },
          { status: 403 }
        );
      }
    }

    // Crear usuario con o sin tenant según corresponda
    const userData: any = {
      name: validatedData.name,
      email: validatedData.email,
      password: null, // No guardar password hasta activación
      role: validatedData.role,
      isActive: validatedData.isActive,
      // Email NO verificado hasta que confirme por correo
      emailVerified: null,
      activationCode: activationCode,
    };

    // Solo agregar tenantId si NO es SUPER_ADMIN
    if (tenantId !== null) {
      userData.tenantId = tenantId;
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        tenantId: true,
        ...(tenantId !== null && {
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
        }),
      },
    });

    console.log('✅ Usuario creado:', user.id, 'Rol:', user.role, 'TenantId:', user.tenantId || 'null (SUPER_ADMIN)');

    // Siempre enviar email de activación/verificación
    if (activationCode) {
      try {
        const emailService = new (await import('@/lib/email/email-service')).EmailService()
        const activationLink = `${process.env['NEXTAUTH_URL'] || ''}/auth/activate?token=${activationCode}`
        const subject = 'Activación de cuenta - Gestión de Eventos'
        const html = `<p>Hola ${user.name},</p><p>Para activar tu cuenta y crear tu contraseña haz clic en el siguiente enlace:</p><p><a href="${activationLink}">Activar cuenta</a></p>`
        
        // Para SUPER_ADMIN no hay tenant, usar undefined
        const emailTenantId = user.tenantId || undefined;
        await emailService.sendEmail({ to: user.email, subject, html, tenantId: emailTenantId }).catch(e => console.error(e))
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
