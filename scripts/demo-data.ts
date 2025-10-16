// 🎭 SCRIPT PARA DATOS DE DEMO CASONA
// Archivo: scripts/demo-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('🎪 Iniciando seed de datos para demo...');

  try {
    // 1. Crear usuarios/clientes de prueba
    console.log('👥 Creando clientes...');
    
    const maria = await prisma.user.upsert({
      where: { email: 'maria.gonzalez@constructora-gonzalez.com' },
      update: {},
      create: {
        email: 'maria.gonzalez@constructora-gonzalez.com',
        name: 'María González',
        role: 'USER',
      },
    });

    const carlos = await prisma.user.upsert({
      where: { email: 'carlos.mendez@email.com' },
      update: {},
      create: {
        email: 'carlos.mendez@email.com',
        name: 'Carlos Méndez',
        role: 'USER',
      },
    });

    const roberto = await prisma.user.upsert({
      where: { email: 'eventos@innovar.tech' },
      update: {},
      create: {
        email: 'eventos@innovar.tech',
        name: 'Roberto Silva',
        role: 'USER',
      },
    });

    // 2. Crear clientes con información adicional
    console.log('🏢 Creando perfiles de clientes...');

    const mariaClient = await prisma.client.upsert({
      where: { email: 'maria.gonzalez@constructora-gonzalez.com' },
      update: {},
      create: {
        name: 'María González',
        email: 'maria.gonzalez@constructora-gonzalez.com',
        phone: '+502 5555-1234',
        company: 'Constructora González S.A.',
        clientType: 'CORPORATE',
        notes: 'Cliente Premium - Paga puntualmente. Siempre solicita valet parking.',
        createdById: maria.id,
      },
    });

    const carlosClient = await prisma.client.upsert({
      where: { email: 'carlos.mendez@email.com' },
      update: {},
      create: {
        name: 'Carlos y Ana Méndez',
        email: 'carlos.mendez@email.com',
        phone: '+502 5555-2345',
        company: null,
        clientType: 'INDIVIDUAL',
        notes: 'Boda San Valentín. Preferencia por decoración romántica en tonos rosas.',
        createdById: carlos.id,
      },
    });

    const robertoClient = await prisma.client.upsert({
      where: { email: 'eventos@innovar.tech' },
      update: {},
      create: {
        name: 'Tecnológica Innovar',
        email: 'eventos@innovar.tech',
        phone: '+502 5555-3456',
        company: 'Tecnológica Innovar',
        clientType: 'CORPORATE',
        notes: 'Empresa tech. Prefieren espacios modernos con buena conectividad.',
        createdById: roberto.id,
      },
    });

    // 3. Crear venues
    console.log('🏛️ Creando venues...');

    let salonPrincipal = await prisma.venue.findFirst({
      where: { name: 'Salón Principal' }
    });
    if (!salonPrincipal) {
      salonPrincipal = await prisma.venue.create({
        data: {
          name: 'Salón Principal',
          description: 'Elegante salón principal con capacidad para 150 personas. Aire acondicionado, Sistema de sonido, Iluminación LED, Proyector. 200 m² - Ideal para bodas y eventos corporativos',
          capacity: 150,
          hourlyRate: 500,
          location: 'Planta principal',
        },
      });
    }

    let jardinTerraza = await prisma.venue.findFirst({
      where: { name: 'Jardín Terraza' }
    });
    if (!jardinTerraza) {
      jardinTerraza = await prisma.venue.create({
        data: {
          name: 'Jardín Terraza',
          description: 'Hermoso jardín con vista panorámica. Vista panorámica, Jardín natural, Pérgola, Iluminación exterior. 300 m² - Perfecto para eventos al aire libre',
          capacity: 100,
          hourlyRate: 400,
          location: 'Terraza superior',
        },
      });
    }

    let salonEjecutivo = await prisma.venue.findFirst({
      where: { name: 'Salón Ejecutivo' }
    });
    if (!salonEjecutivo) {
      salonEjecutivo = await prisma.venue.create({
        data: {
          name: 'Salón Ejecutivo',
          description: 'Sala ejecutiva para reuniones corporativas. Mesa boardroom, Proyector 4K, WiFi empresarial, Catering ejecutivo. 80 m² - Ideal para reuniones y capacitaciones',
          capacity: 50,
          hourlyRate: 300,
          location: 'Segundo piso',
        },
      });
    }

    // 4. Crear eventos pasados
    console.log('📅 Creando eventos pasados...');

    const bodaGarcia = await prisma.event.create({
      data: {
        title: 'Boda García-López',
        description: 'Boda elegante en salón principal',
        startDate: new Date('2024-10-02T18:00:00Z'),
        endDate: new Date('2024-10-03T02:00:00Z'),
        duration: 8,
        guestCount: 140,
        status: 'COMPLETED',
        eventType: 'Boda',
        clientId: carlosClient.id,
        venueId: salonPrincipal.id,
        createdById: carlos.id,
      },
    });

      // Lanzamiento TechCorp event
      await prisma.event.create({
        data: {
          title: 'Lanzamiento App TechCorp',
          description: 'Lanzamiento de nueva aplicación móvil',
          startDate: new Date('2024-09-15T19:00:00Z'),
          endDate: new Date('2024-09-15T23:00:00Z'),
          duration: 4,
          guestCount: 80,
          status: 'COMPLETED',
          eventType: 'Corporativo',
          clientId: robertoClient.id,
          venueId: jardinTerraza.id,
          createdById: roberto.id,
        },
      });

    // 5. Crear eventos futuros
    console.log('🔮 Creando eventos futuros...');

    await prisma.event.create({
      data: {
        title: 'Boda Méndez-Torres',
        description: 'Boda temática San Valentín',
        startDate: new Date('2025-02-14T17:00:00Z'),
        endDate: new Date('2025-02-15T01:00:00Z'),
        duration: 8,
        guestCount: 120,
        status: 'CONFIRMED',
        eventType: 'Boda',
        clientId: carlosClient.id,
        venueId: salonPrincipal.id,
        createdById: carlos.id,
      },
    });

    await prisma.event.create({
      data: {
        title: 'Capacitación Anual 2025',
        description: 'Capacitación técnica anual para empleados',
        startDate: new Date('2025-03-20T08:00:00Z'),
        endDate: new Date('2025-03-20T17:00:00Z'),
        duration: 9,
        guestCount: 45,
        status: 'QUOTED',
        eventType: 'Capacitación',
        clientId: mariaClient.id,
        venueId: salonEjecutivo.id,
        createdById: maria.id,
      },
    });

    // 6. Crear servicios
    console.log('🎵 Creando servicios...');

    const services = [
      { name: 'DJ Profesional', basePrice: 2500, category: 'Entretenimiento', unit: 'evento' },
      { name: 'Fotografía', basePrice: 3000, category: 'Multimedia', unit: 'evento' },
      { name: 'Decoración Premium', basePrice: 4000, category: 'Decoración', unit: 'evento' },
      { name: 'Catering Ejecutivo', basePrice: 60, category: 'Catering', unit: 'persona' },
      { name: 'Meseros', basePrice: 200, category: 'Servicio', unit: 'persona' },
      { name: 'Sistema de Sonido', basePrice: 1200, category: 'Equipo', unit: 'evento' },
      { name: 'Iluminación LED', basePrice: 800, category: 'Equipo', unit: 'evento' },
      { name: 'Mobiliario Premium', basePrice: 1500, category: 'Mobiliario', unit: 'evento' },
    ];

    for (const service of services) {
      const existing = await prisma.service.findFirst({
        where: { name: service.name }
      });
      if (!existing) {
        await prisma.service.create({
          data: service
        });
      }
    }

    // 7. Crear embeddings para búsqueda semántica
    console.log('🧠 Creando embeddings para IA...');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const embeddingData = [
      {
        contentType: 'venue',
        contentId: salonPrincipal.id,
        contentText: `${salonPrincipal.name}: ${salonPrincipal.description}. Capacidad: ${salonPrincipal.capacity} personas. Precio: Q${salonPrincipal.hourlyRate}/hora.`,
      },
      {
        contentType: 'venue', 
        contentId: jardinTerraza.id,
        contentText: `${jardinTerraza.name}: ${jardinTerraza.description}. Capacidad: ${jardinTerraza.capacity} personas. Precio: Q${jardinTerraza.hourlyRate}/hora.`,
      },
      {
        contentType: 'client',
        contentId: mariaClient.id,
        contentText: `${mariaClient.name} de ${mariaClient.company}. Tipo: ${mariaClient.clientType}. ${mariaClient.notes}`,
      },
      {
        contentType: 'event',
        contentId: bodaGarcia.id,
        contentText: `${bodaGarcia.title}: ${bodaGarcia.description}. ${bodaGarcia.guestCount} invitados. Tipo: ${bodaGarcia.eventType}.`,
      },
    ];

    // Los embeddings se crearán mediante la API de indexing después

    console.log('✅ ¡Datos de demo creados exitosamente!');
    console.log(`
📊 RESUMEN DE DATOS CREADOS:
- 👥 Usuarios: 3
- 🏢 Clientes: 3
- 🏛️ Venues: 3  
- 📅 Eventos: 4 (2 completados, 2 futuros)
- 🎵 Servicios: 8

🎪 ¡La demo está lista para impresionar a Casona!
    `);

  } catch (error) {
    console.error('❌ Error creando datos de demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedDemoData;