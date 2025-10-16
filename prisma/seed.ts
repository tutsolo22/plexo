import { PrismaClient } from '@prisma/client'

// Importar los enums desde Prisma
const { UserRole, ClientType, EventStatus, QuoteStatus } = {
  UserRole: {
    USER: 'USER' as const,
    MANAGER: 'MANAGER' as const,
    ADMIN: 'ADMIN' as const,
    SUPER_ADMIN: 'SUPER_ADMIN' as const,
  },
  ClientType: {
    INDIVIDUAL: 'INDIVIDUAL' as const,
    CORPORATE: 'CORPORATE' as const,
    GOVERNMENT: 'GOVERNMENT' as const,
    NONPROFIT: 'NONPROFIT' as const,
  },
  EventStatus: {
    QUOTED: 'QUOTED' as const,
    RESERVED: 'RESERVED' as const,
    CONFIRMED: 'CONFIRMED' as const,
    IN_PROGRESS: 'IN_PROGRESS' as const,
    COMPLETED: 'COMPLETED' as const,
    CANCELLED: 'CANCELLED' as const,
  },
  QuoteStatus: {
    DRAFT: 'DRAFT' as const,
    PENDING_APPROVAL: 'PENDING_APPROVAL' as const,
    APPROVED: 'APPROVED' as const,
    SENT_TO_CLIENT: 'SENT_TO_CLIENT' as const,
    ACCEPTED: 'ACCEPTED' as const,
    REJECTED: 'REJECTED' as const,
    EXPIRED: 'EXPIRED' as const,
  },
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear usuario administrador
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gestioneventos.com' },
    update: {},
    create: {
      email: 'admin@gestioneventos.com',
      name: 'Administrador',
      role: UserRole.SUPER_ADMIN,
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
      role: UserRole.MANAGER,
    },
  })

  console.log('✅ Usuario manager creado:', managerUser.email)

  // Crear venues de ejemplo
  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        name: 'Salón Principal',
        description: 'Salón principal para eventos grandes',
        location: 'Planta Principal',
        capacity: 150,
        hourlyRate: 500.00,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Terraza Jardín',
        description: 'Terraza al aire libre con jardín',
        location: 'Segundo Piso',
        capacity: 80,
        hourlyRate: 350.00,
      },
    }),
    prisma.venue.create({
      data: {
        name: 'Sala VIP',
        description: 'Sala íntima para eventos exclusivos',
        location: 'Tercer Piso',
        capacity: 30,
        hourlyRate: 800.00,
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
        category: 'Mobiliario',
        basePrice: 15.00,
        unit: 'unidad',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mesa Redonda 8 personas',
        description: 'Mesa redonda para 8 comensales',
        category: 'Mobiliario',
        basePrice: 75.00,
        unit: 'unidad',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mantel Blanco Premium',
        description: 'Mantel de tela premium',
        category: 'Lencería',
        basePrice: 25.00,
        unit: 'unidad',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Centro de Mesa Floral',
        description: 'Arreglo floral para centro de mesa',
        category: 'Decoración',
        basePrice: 45.00,
        unit: 'unidad',
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
        category: 'Personal',
        basePrice: 25.00,
        unit: 'hora',
      },
    }),
    prisma.service.create({
      data: {
        name: 'DJ Profesional',
        description: 'Servicio de música y sonido',
        category: 'Entretenimiento',
        basePrice: 150.00,
        unit: 'hora',
      },
    }),
    prisma.service.create({
      data: {
        name: 'Fotografía Profesional',
        description: 'Servicio de fotografía para eventos',
        category: 'Fotografía',
        basePrice: 200.00,
        unit: 'hora',
      },
    }),
    prisma.service.create({
      data: {
        name: 'Decoración Completa',
        description: 'Servicio integral de decoración',
        category: 'Decoración',
        basePrice: 300.00,
        unit: 'evento',
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
        clientType: ClientType.INDIVIDUAL,
        address: 'Ciudad de Guatemala',
        createdById: managerUser.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Empresa ABC S.A.',
        email: 'eventos@empresaabc.com',
        phone: '+502 8765-4321',
        company: 'Empresa ABC S.A.',
        clientType: ClientType.CORPORATE,
        address: 'Zona 10, Ciudad de Guatemala',
        createdById: managerUser.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '+502 5555-1234',
        clientType: ClientType.INDIVIDUAL,
        address: 'Antigua Guatemala',
        createdById: adminUser.id,
      },
    }),
  ])

  console.log('✅ Clientes creados:', clients.length)

  // Crear eventos de ejemplo
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Boda de María y Juan',
        description: 'Celebración de matrimonio en jardín',
        startDate: new Date('2024-12-15T18:00:00Z'),
        endDate: new Date('2024-12-15T23:00:00Z'),
        duration: 5,
        status: EventStatus.CONFIRMED,
        eventType: 'Boda',
        guestCount: 120,
        confirmedGuests: 120,
        clientId: clients[0].id,
        venueId: venues[1].id, // Terraza Jardín
        createdById: managerUser.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Conferencia Anual Empresa ABC',
        description: 'Evento corporativo anual',
        startDate: new Date('2024-11-20T09:00:00Z'),
        endDate: new Date('2024-11-20T17:00:00Z'),
        duration: 8,
        status: EventStatus.RESERVED,
        eventType: 'Corporativo',
        guestCount: 100,
        confirmedGuests: 85,
        clientId: clients[1].id,
        venueId: venues[0].id, // Salón Principal
        createdById: adminUser.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Cumpleaños 50 años Carlos',
        description: 'Celebración de cumpleaños íntima',
        startDate: new Date('2024-11-30T19:00:00Z'),
        endDate: new Date('2024-11-30T23:00:00Z'),
        duration: 4,
        status: EventStatus.QUOTED,
        eventType: 'Cumpleaños',
        guestCount: 25,
        confirmedGuests: 0,
        clientId: clients[2].id,
        venueId: venues[2].id, // Sala VIP
        createdById: managerUser.id,
      },
    }),
  ])

  console.log('✅ Eventos creados:', events.length)

  // Crear cotizaciones de ejemplo
  const quote = await prisma.quote.create({
    data: {
      number: 'QUO-2024-001',
      status: QuoteStatus.APPROVED,
      validUntil: new Date('2024-11-15T23:59:59Z'),
      subtotal: 2500.00,
      tax: 300.00,
      total: 2800.00,
      notes: 'Cotización para evento de cumpleaños',
      clientId: clients[2].id,
      eventId: events[2].id,
      createdById: managerUser.id,
    },
  })

  console.log('✅ Cotización creada:', quote.number)

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