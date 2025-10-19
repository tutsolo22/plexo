import { PrismaClient, LegacyUserRole, ClientType, EventStatus, QuoteStatus, VenueType, ItemType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear tenant principal
  const mainTenant = await prisma.tenant.upsert({
    where: { domain: 'plexo.mx' },
    update: {},
    create: {
      name: 'Plexo - Gestión de Eventos',
      domain: 'plexo.mx',
      isActive: true,
    },
  })

  console.log('✅ Tenant principal creado:', mainTenant.name)

  // Crear Business Identity
  const businessIdentity = await prisma.businessIdentity.upsert({
    where: { 
      id: 'plexo-main-identity'
    },
    update: {},
    create: {
      id: 'plexo-main-identity',
      name: 'Plexo Eventos',
      email: 'contacto@plexo.mx',
      phone: '+52 55 1234 5678',
      address: 'Av. Reforma 123, Ciudad de México, CDMX',
      website: 'https://plexo.mx',
      logo: '/logos/plexo-logo.png',
      slogan: 'Creamos experiencias inolvidables',
      facebook: 'https://facebook.com/plexoeventos',
      instagram: 'https://instagram.com/plexoeventos',
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Business Identity creado:', businessIdentity.name)

  // Hash para contraseña de prueba (password: 'password123')
  const testPasswordHash = await bcrypt.hash('password123', 10)

  // Crear usuario de soporte para pruebas locales
  const supportUser = await prisma.user.upsert({
    where: { email: 'soporteapps@hexalux.mx' },
    update: {},
    create: {
      email: 'soporteapps@hexalux.mx',
      password: testPasswordHash,
      name: 'Soporte Apps Hexalux',
      role: LegacyUserRole.SUPER_ADMIN,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Usuario de soporte creado:', supportUser.email)

  // Crear venues de ejemplo
  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        name: 'Salón Principal Plexo',
        description: 'Salón principal para eventos grandes con capacidad para 150 personas',
        type: VenueType.VENUE,
        capacity: 150,
        tenantId: mainTenant.id,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Terraza Jardín Vista',
        description: 'Terraza al aire libre con jardín y vista panorámica',
        type: VenueType.VENUE,
        capacity: 80,
        tenantId: mainTenant.id,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Sala VIP Ejecutiva',
        description: 'Sala íntima para eventos exclusivos y corporativos',
        type: VenueType.VENUE,
        capacity: 30,
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Venues creados:', venues.length)

  // Crear productos de ejemplo (precios en pesos mexicanos)
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Silla Chiavari Dorada',
        description: 'Silla elegante para eventos con acabado dorado',
        price: 280.00, // ~$15 USD = $280 MXN
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mesa Redonda 8 personas',
        description: 'Mesa redonda para 8 comensales con mantel incluido',
        price: 1350.00, // ~$75 USD = $1,350 MXN
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mantel Blanco Premium',
        description: 'Mantel de tela premium 100% algodón',
        price: 450.00, // ~$25 USD = $450 MXN
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Centro de Mesa Floral',
        description: 'Arreglo floral natural para centro de mesa',
        price: 810.00, // ~$45 USD = $810 MXN
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Productos creados:', products.length)

  // Crear servicios de ejemplo (precios en pesos mexicanos)
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Servicio de Meseros Profesional',
        description: 'Personal de servicio profesional certificado',
        price: 450.00, // ~$25 USD = $450 MXN por hora
        unit: 'hora',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'DJ Profesional con Equipo',
        description: 'Servicio de música y sonido profesional',
        price: 2700.00, // ~$150 USD = $2,700 MXN por hora
        unit: 'hora',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Fotografía Profesional',
        description: 'Servicio completo de fotografía para eventos',
        price: 3600.00, // ~$200 USD = $3,600 MXN por hora
        unit: 'hora',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Decoración Completa Premium',
        description: 'Servicio integral de decoración y ambientación',
        price: 5400.00, // ~$300 USD = $5,400 MXN por evento
        unit: 'evento',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Servicios creados:', services.length)

  // Crear plantillas de cotización predefinidas
  const quoteTemplates = await Promise.all([
    prisma.quoteTemplate.create({
      data: {
        name: 'Plantilla Boda Elegante',
        description: 'Plantilla para cotizaciones de bodas elegantes',
        type: 'QUOTE',
        category: 'Bodas',
        htmlContent: '<h1>Cotización Boda Elegante</h1><p>Estimados {{clientName}}</p><p>Total: {{total}}</p>',
        variables: ['clientName', 'total', 'date', 'venue'],
        isDefault: false,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.quoteTemplate.create({
      data: {
        name: 'Plantilla Evento Corporativo',
        description: 'Plantilla para eventos corporativos y empresariales',
        type: 'QUOTE',
        category: 'Corporativo',
        htmlContent: '<h1>Propuesta Evento Corporativo</h1><p>Empresa: {{clientName}}</p><p>Total: {{total}}</p>',
        variables: ['clientName', 'total', 'date', 'attendees'],
        isDefault: false,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.quoteTemplate.create({
      data: {
        name: 'Plantilla XV Años',
        description: 'Plantilla especializada para celebraciones de quinceañeras',
        type: 'QUOTE',
        category: 'Sociales',
        htmlContent: '<h1>Cotización XV Años</h1><p>Familia {{clientName}}</p><p>Total: {{total}}</p>',
        variables: ['clientName', 'total', 'date', 'guests'],
        isDefault: false,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.quoteTemplate.create({
      data: {
        name: 'Plantilla General',
        description: 'Plantilla general para todo tipo de eventos',
        type: 'QUOTE',
        category: 'General',
        htmlContent: '<h1>Cotización de Evento</h1><p>Cliente: {{clientName}}</p><p>Total: {{total}}</p>',
        variables: ['clientName', 'total', 'date'],
        isDefault: true,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
  ])

  console.log('✅ Plantillas de cotización creadas:', quoteTemplates.length)

  // Crear plantillas de email por defecto
  const emailTemplates = await Promise.all([
    prisma.emailTemplate.create({
      data: {
        name: 'Bienvenida y Activación de Cuenta',
        subject: 'Bienvenido a la familia {{businessName}} - Activa tu cuenta',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">¡Bienvenido a la familia {{businessName}}!</h1>
            <p>Estimado/a {{clientName}},</p>
            <p>Te damos la más cordial bienvenida a nuestra familia de clientes. Estamos emocionados de tenerte con nosotros.</p>
            <p>Para completar tu registro, por favor activa tu cuenta haciendo clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{activationLink}}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Activar Cuenta</a>
            </div>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Atentamente,<br>Equipo {{businessName}}</p>
          </div>
        `,
        variables: ['businessName', 'clientName', 'activationLink'],
        category: 'REGISTRATION',
        isDefault: true,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.emailTemplate.create({
      data: {
        name: 'Recuperación de Contraseña',
        subject: 'Recupera tu contraseña - {{businessName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Recuperación de Contraseña</h1>
            <p>Hola {{clientName}},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en {{businessName}}.</p>
            <p>Si solicitaste este cambio, haz clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetLink}}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
            </div>
            <p><strong>Este enlace expira en 24 horas.</strong></p>
            <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            <p>Saludos,<br>Equipo {{businessName}}</p>
          </div>
        `,
        variables: ['businessName', 'clientName', 'resetLink'],
        category: 'PASSWORD_RESET',
        isDefault: true,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.emailTemplate.create({
      data: {
        name: 'Reenvío de Activación',
        subject: 'Recordatorio: Activa tu cuenta en {{businessName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Recordatorio de Activación</h1>
            <p>Hola {{clientName}},</p>
            <p>Notamos que aún no has activado tu cuenta en {{businessName}}.</p>
            <p>Para poder disfrutar de todos nuestros servicios, por favor activa tu cuenta:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{activationLink}}" style="background-color: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Activar Ahora</a>
            </div>
            <p>Si tienes problemas para activar tu cuenta, contáctanos.</p>
            <p>Quedamos a tu disposición,<br>Equipo {{businessName}}</p>
          </div>
        `,
        variables: ['businessName', 'clientName', 'activationLink'],
        category: 'ACTIVATION_REMINDER',
        isDefault: true,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.emailTemplate.create({
      data: {
        name: 'Envío de Cotización',
        subject: 'Tu cotización está lista - {{businessName}}',
        htmlContent: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
          '<h1 style="color: #10b981;">¡Tu Cotización Está Lista!</h1>' +
          '<p>Estimado/a {{clientName}},</p>' +
          '<p>Nos complace enviarte la cotización para tu evento: <strong>{{eventTitle}}</strong></p>' +
          '<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">' +
          '<h3>Detalles del Evento:</h3>' +
          '<p><strong>Fecha:</strong> {{eventDate}}</p>' +
          '<p><strong>Ubicación:</strong> {{eventLocation}}</p>' +
          '<p><strong>Total:</strong> ${{quoteTotal}}</p>' +
          '</div>' +
          '<div style="text-align: center; margin: 30px 0;">' +
          '<a href="{{quoteLink}}" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Ver Cotización</a>' +
          '</div>' +
          '<p>Esta cotización es válida hasta: <strong>{{validUntil}}</strong></p>' +
          '<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>' +
          '<p>¡Esperamos trabajar contigo!</p>' +
          '<p>Atentamente,<br>Equipo {{businessName}}</p>' +
          '</div>',
        variables: ['businessName', 'clientName', 'eventTitle', 'eventDate', 'eventLocation', 'quoteTotal', 'quoteLink', 'validUntil'],
        category: 'QUOTE_SEND',
        isDefault: true,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.emailTemplate.create({
      data: {
        name: 'Cotización Aceptada - Agradecimiento',
        subject: '¡Gracias por elegirnos! - {{businessName}}',
        htmlContent: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
          '<div style="text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">' +
          '<h1 style="margin: 0; font-size: 28px;">¡Gracias por Elegirnos!</h1>' +
          '<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu evento está en las mejores manos</p>' +
          '</div>' +
          '<div style="padding: 30px; background-color: #f9fafb;">' +
          '<p>Estimado/a {{clientName}},</p>' +
          '<p>¡Estamos emocionados de que hayas aceptado nuestra cotización para <strong>{{eventTitle}}</strong>!</p>' +
          '<div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">' +
          '<h3 style="color: #10b981; margin-top: 0;">Detalles del Evento</h3>' +
          '<p><strong>Evento:</strong> {{eventTitle}}</p>' +
          '<p><strong>Fecha:</strong> {{eventDate}}</p>' +
          '<p><strong>Ubicación:</strong> {{eventLocation}}</p>' +
          '<p><strong>Total:</strong> ${{quoteTotal}}</p>' +
          '</div>' +
          '<h3 style="color: #374151;">Próximos Pasos:</h3>' +
          '<ol style="color: #6b7280; line-height: 1.6;">' +
          '<li><strong>Contacto Personal:</strong> Nos pondremos en contacto contigo en las próximas 24 horas.</li>' +
          '<li><strong>Firma de Contrato:</strong> Coordinaremos la firma del contrato oficial.</li>' +
          '<li><strong>Planificación:</strong> Trabajaremos juntos en cada detalle de tu evento.</li>' +
          '</ol>' +
          '<div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">' +
          '<p style="margin: 0; color: #92400e;"><strong>💫 Nuestra Promesa:</strong> Nos comprometemos a hacer de tu evento una experiencia inolvidable que supere tus expectativas.</p>' +
          '</div>' +
          '<p>Puedes ver todos los detalles en: <a href="{{acceptanceLink}}" style="color: #10b981;">{{acceptanceLink}}</a></p>' +
          '<div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px;">' +
          '<p style="color: #9ca3af; font-size: 14px;">Atentamente,<br>{{businessName}}</p>' +
          '</div>' +
          '</div>' +
          '</div>',
        variables: ['businessName', 'clientName', 'eventTitle', 'eventDate', 'eventLocation', 'quoteTotal', 'acceptanceLink'],
        category: 'QUOTE_ACCEPTED',
        isDefault: true,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
    prisma.emailTemplate.create({
      data: {
        name: 'Email de Prueba',
        subject: 'Prueba de Sistema de Emails - {{businessName}}',
        htmlContent: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
          '<h1 style="color: #8b5cf6;">Email de Prueba</h1>' +
          '<p>Hola {{recipientName}},</p>' +
          '<p>Este es un email de prueba del sistema de {{businessName}}.</p>' +
          '<p>Si recibes este mensaje, significa que el sistema de emails está funcionando correctamente.</p>' +
          '<div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0;">' +
          '<p><strong>Información del sistema:</strong></p>' +
          '<p>Fecha de envío: {{timestamp}}</p>' +
          '<p>Servidor: {{serverInfo}}</p>' +
          '</div>' +
          '<p>Gracias por usar nuestros servicios.</p>' +
          '<p>Saludos,<br>Equipo Técnico {{businessName}}</p>' +
          '</div>',
        variables: ['businessName', 'recipientName', 'timestamp', 'serverInfo'],
        category: 'TEST',
        isDefault: true,
        tenantId: mainTenant.id,
        businessIdentityId: businessIdentity.id,
      },
    }),
  ])

  console.log('✅ Plantillas de email creadas:', emailTemplates.length)

  // Crear clientes de ejemplo con datos mexicanos
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { 
        email_tenantId: {
          email: 'maria.garcia@email.com',
          tenantId: mainTenant.id
        }
      },
      update: {},
      create: {
        name: 'María García Hernández',
        email: 'maria.garcia@email.com',
        phone: '+52 55 1234-5678',
        type: ClientType.GENERAL,
        address: 'Colonia Roma Norte, Ciudad de México, CDMX',
        tenantId: mainTenant.id,
      },
    }),
    prisma.client.upsert({
      where: { 
        email_tenantId: {
          email: 'eventos@corporativomexico.com',
          tenantId: mainTenant.id
        }
      },
      update: {},
      create: {
        name: 'Corporativo México S.A. de C.V.',
        email: 'eventos@corporativomexico.com',
        phone: '+52 55 8765-4321',
        type: ClientType.COLABORADOR,
        address: 'Polanco, Ciudad de México, CDMX',
        tenantId: mainTenant.id,
      },
    }),
    prisma.client.upsert({
      where: { 
        email_tenantId: {
          email: 'carlos.rodriguez@email.com',
          tenantId: mainTenant.id
        }
      },
      update: {},
      create: {
        name: 'Carlos Rodríguez López',
        email: 'carlos.rodriguez@email.com',
        phone: '+52 55 5555-1234',
        type: ClientType.EXTERNO,
        address: 'Coyoacán, Ciudad de México, CDMX',
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Clientes creados:', clients.length)

  // Crear eventos de ejemplo con fechas actualizadas para 2025
  const events = await Promise.all([
    prisma.event.upsert({
      where: {
        id: 'boda-maria-juan-2025'
      },
      update: {},
      create: {
        id: 'boda-maria-juan-2025',
        title: 'Boda de María y Juan',
        notes: 'Celebración de matrimonio en jardín',
        startDate: new Date('2025-12-15T18:00:00Z'),
        endDate: new Date('2025-12-15T23:00:00Z'),
        status: EventStatus.CONFIRMED,
        clientId: clients[0].id,
        venueId: venues[1].id, // Terraza Jardín
        tenantId: mainTenant.id,
      },
    }),
    prisma.event.upsert({
      where: {
        id: 'conferencia-empresa-abc-2025'
      },
      update: {},
      create: {
        id: 'conferencia-empresa-abc-2025',
        title: 'Conferencia Anual Empresa ABC',
        notes: 'Evento corporativo anual',
        startDate: new Date('2025-11-20T09:00:00Z'),
        endDate: new Date('2025-11-20T17:00:00Z'),
        status: EventStatus.RESERVED,
        clientId: clients[1].id,
        venueId: venues[0].id, // Salón Principal
        tenantId: mainTenant.id,
      },
    }),
    prisma.event.upsert({
      where: {
        id: 'cumpleanos-carlos-2025'
      },
      update: {},
      create: {
        id: 'cumpleanos-carlos-2025',
        title: 'Cumpleaños 50 años Carlos',
        notes: 'Celebración de cumpleaños íntima',
        startDate: new Date('2025-11-30T19:00:00Z'),
        endDate: new Date('2025-11-30T23:00:00Z'),
        status: EventStatus.QUOTED,
        clientId: clients[2].id,
        venueId: venues[2].id, // Sala VIP
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Eventos creados:', events.length)

  // Crear cotizaciones de ejemplo con precios en pesos mexicanos
  const quote = await prisma.quote.upsert({
    where: {
      quoteNumber: 'QUO-2025-001'
    },
    update: {},
    create: {
      quoteNumber: 'QUO-2025-001',
      status: QuoteStatus.APPROVED_BY_MANAGER,
      validUntil: new Date('2025-12-15T23:59:59Z'),
      subtotal: 45000.00, // ~$2,500 USD = $45,000 MXN
      discount: 0.00,
      total: 45000.00,
      notes: 'Cotización para evento de cumpleaños - Precios en pesos mexicanos',
      clientId: clients[2].id,
      eventId: events[2].id,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Cotización creada:', quote.quoteNumber)

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })