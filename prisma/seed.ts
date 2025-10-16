import { PrismaClient, LegacyUserRole, ClientType, EventStatus, QuoteStatus, VenueType, ItemType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear tenant principal
  const mainTenant = await prisma.tenant.upsert({
    where: { domain: 'gestioneventos.com' },
    update: {},
    create: {
      name: 'Gestión de Eventos - Demo',
      domain: 'gestioneventos.com',
      isActive: true,
    },
  })

  console.log('✅ Tenant principal creado:', mainTenant.name)

  // Crear usuario administrador
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gestioneventos.com' },
    update: {},
    create: {
      email: 'admin@gestioneventos.com',
      name: 'Administrador',
      role: LegacyUserRole.SUPER_ADMIN,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Usuario administrador creado:', adminUser.email)

  // Crear usuario manager
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@gestioneventos.com' },
    update: {},
    create: {
      email: 'manager@gestioneventos.com',
      name: 'Manager',
      role: LegacyUserRole.MANAGER,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Usuario manager creado:', managerUser.email)

  // Crear venues de ejemplo
  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        name: 'Salón Principal',
        description: 'Salón principal para eventos grandes',
        type: VenueType.VENUE,
        capacity: 150,
        tenantId: mainTenant.id,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Terraza Jardín',
        description: 'Terraza al aire libre con jardín',
        type: VenueType.VENUE,
        capacity: 80,
        tenantId: mainTenant.id,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Sala VIP',
        description: 'Sala íntima para eventos exclusivos',
        type: VenueType.VENUE,
        capacity: 30,
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Venues creados:', venues.length)

  // Crear productos de ejemplo
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Silla Chiavari Dorada',
        description: 'Silla elegante para eventos',
        price: 15.00,
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mesa Redonda 8 personas',
        description: 'Mesa redonda para 8 comensales',
        price: 75.00,
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mantel Blanco Premium',
        description: 'Mantel de tela premium',
        price: 25.00,
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Centro de Mesa Floral',
        description: 'Arreglo floral para centro de mesa',
        price: 45.00,
        unit: 'unidad',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Productos creados:', products.length)

  // Crear servicios de ejemplo
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Servicio de Meseros',
        description: 'Personal de servicio profesional',
        price: 25.00,
        unit: 'hora',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'DJ Profesional',
        description: 'Servicio de música y sonido',
        price: 150.00,
        unit: 'hora',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Fotografía Profesional',
        description: 'Servicio de fotografía para eventos',
        price: 200.00,
        unit: 'hora',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Decoración Completa',
        description: 'Servicio integral de decoración',
        price: 300.00,
        unit: 'evento',
        itemType: ItemType.VENTA,
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Servicios creados:', services.length)

  // Crear clientes de ejemplo
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'María García',
        email: 'maria.garcia@email.com',
        phone: '+502 1234-5678',
        type: ClientType.GENERAL,
        address: 'Ciudad de Guatemala',
        tenantId: mainTenant.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Empresa ABC S.A.',
        email: 'eventos@empresaabc.com',
        phone: '+502 8765-4321',
        type: ClientType.COLABORADOR,
        address: 'Zona 10, Ciudad de Guatemala',
        tenantId: mainTenant.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '+502 5555-1234',
        type: ClientType.EXTERNO,
        address: 'Antigua Guatemala',
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Clientes creados:', clients.length)

  // Crear eventos de ejemplo
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Boda de María y Juan',
        notes: 'Celebración de matrimonio en jardín',
        startDate: new Date('2024-12-15T18:00:00Z'),
        endDate: new Date('2024-12-15T23:00:00Z'),
        status: EventStatus.CONFIRMED,
        clientId: clients[0].id,
        venueId: venues[1].id, // Terraza Jardín
        tenantId: mainTenant.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Conferencia Anual Empresa ABC',
        notes: 'Evento corporativo anual',
        startDate: new Date('2024-11-20T09:00:00Z'),
        endDate: new Date('2024-11-20T17:00:00Z'),
        status: EventStatus.RESERVED,
        clientId: clients[1].id,
        venueId: venues[0].id, // Salón Principal
        tenantId: mainTenant.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Cumpleaños 50 años Carlos',
        notes: 'Celebración de cumpleaños íntima',
        startDate: new Date('2024-11-30T19:00:00Z'),
        endDate: new Date('2024-11-30T23:00:00Z'),
        status: EventStatus.QUOTED,
        clientId: clients[2].id,
        venueId: venues[2].id, // Sala VIP
        tenantId: mainTenant.id,
      },
    }),
  ])

  console.log('✅ Eventos creados:', events.length)

  // Crear cotizaciones de ejemplo
  const quote = await prisma.quote.create({
    data: {
      quoteNumber: 'QUO-2024-001',
      status: QuoteStatus.APPROVED_BY_MANAGER,
      validUntil: new Date('2024-11-15T23:59:59Z'),
      subtotal: 2500.00,
      discount: 0.00,
      total: 2500.00,
      notes: 'Cotización para evento de cumpleaños',
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