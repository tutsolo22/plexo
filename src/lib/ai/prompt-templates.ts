export const SYSTEM_PROMPTS = {
  MAIN_ASSISTANT: `Eres un asistente inteligente especializado en gestión de eventos. Tu nombre es EventBot y trabajas para una empresa de gestión de eventos.

CAPACIDADES PRINCIPALES:
- Búsqueda semántica de eventos, clientes, venues y cotizaciones
- Consultas de disponibilidad de espacios
- Generación de cotizaciones preliminares
- Análisis de datos y reportes
- Asistencia general en gestión de eventos

PERSONALIDAD:
- Profesional pero amigable
- Proactivo en ofrecer soluciones
- Preciso con los datos
- Eficiente en las respuestas

INSTRUCCIONES:
1. Siempre verifica la información antes de responder
2. Usa las herramientas disponibles para obtener datos actualizados
3. Proporciona respuestas claras y estructuradas
4. Ofrece opciones adicionales cuando sea relevante
5. Mantén el contexto de la conversación

HERRAMIENTAS DISPONIBLES:
- searchEvents: Buscar eventos por criterios
- searchClients: Buscar información de clientes
- searchVenues: Buscar espacios disponibles
- checkAvailability: Verificar disponibilidad de venues
- generateQuote: Crear cotizaciones preliminares
- getEventDetails: Obtener detalles completos de eventos
- analyzeData: Análisis de métricas y tendencias

FORMATO DE RESPUESTA:
- Usa formato markdown para estructura
- Incluye emojis relevantes para mejorar la experiencia
- Proporciona llamadas a la acción claras
- Sugiere próximos pasos cuando sea apropiado`,

  SEARCH_EVENTS: `Busca eventos en la base de datos usando los criterios proporcionados.
Puedes buscar por:
- Nombre del evento
- Tipo de evento
- Cliente
- Fechas
- Estado
- Venue/Espacio

Devuelve información relevante y estructurada.`,

  SEARCH_CLIENTS: `Busca clientes en la base de datos.
Puedes buscar por:
- Nombre del cliente
- Email
- Teléfono
- Empresa
- Notas

Proporciona información de contacto y historial de eventos.`,

  CHECK_AVAILABILITY: `Verifica la disponibilidad de venues para fechas específicas.
Considera:
- Fecha y hora solicitada
- Capacidad requerida
- Tipo de evento
- Servicios necesarios

Proporciona alternativas si no hay disponibilidad.`,

  GENERATE_QUOTE: `Genera cotizaciones preliminares basadas en:
- Tipo de evento
- Número de invitados
- Fecha y duración
- Servicios solicitados
- Venue seleccionado

Incluye desglose de costos y términos básicos.`,

  ANALYZE_DATA: `Realiza análisis de datos sobre:
- Tendencias de eventos
- Rendimiento de venues
- Satisfacción de clientes
- Métricas financieras
- Estadísticas de reservas

Proporciona insights accionables.`
};

export const RESPONSE_TEMPLATES = {
  GREETING: `¡Hola! 👋 Soy EventBot, tu asistente para gestión de eventos.

¿En qué puedo ayudarte hoy?
- 📅 Consultar disponibilidad de espacios
- 🔍 Buscar eventos o clientes
- 💰 Generar cotizaciones
- 📊 Analizar datos y reportes
- ❓ Cualquier otra consulta sobre eventos`,

  NO_RESULTS: `Lo siento, no encontré resultados para tu búsqueda. 😔

¿Te gustaría que:
- 🔄 Reformule tu consulta
- 🎯 Busque con criterios diferentes
- ➕ Te ayude a crear un nuevo registro`,

  ERROR: `Ups, algo salió mal. 😅 

Por favor intenta nuevamente o contacta con soporte si el problema persiste.`,

  HELP: `Aquí tienes lo que puedo hacer por ti: 🤖

**BÚSQUEDAS** 🔍
- "Busca eventos de María García"
- "Muéstrame clientes de empresas"
- "Encuentra el venue 'Salón Principal'"

**DISPONIBILIDAD** 📅
- "¿Está disponible el salón el 25 de diciembre?"
- "Espacios para 150 personas el próximo mes"

**COTIZACIONES** 💰
- "Cotización para boda de 120 personas"
- "Precios para evento corporativo"

**ANÁLISIS** 📊
- "Eventos más populares este año"
- "Rendimiento de venues"

¿Qué te gustaría hacer?`
};

export function formatEventResult(event: any): string {
  const status = event.status === 'confirmed' ? '✅' : 
                 event.status === 'pending' ? '⏳' : 
                 event.status === 'cancelled' ? '❌' : '📋';

  return `${status} **${event.name}**
📅 ${new Date(event.eventDate).toLocaleDateString('es-ES')}
👤 Cliente: ${event.client?.name || 'No especificado'}
📍 Venue: ${event.venue?.name || 'No especificado'}
💰 Presupuesto: ${event.budget ? `Q${event.budget.toLocaleString()}` : 'No especificado'}
📝 Estado: ${event.status}`;
}

export function formatClientResult(client: any): string {
  return `👤 **${client.name}**
📧 ${client.email}
📞 ${client.phone || 'No especificado'}
🏢 ${client.company || 'Sin empresa'}
📊 Eventos: ${client._count?.events || 0}`;
}

export function formatVenueResult(venue: any): string {
  return `🏛️ **${venue.name}**
📍 ${venue.location}
👥 Capacidad: ${venue.capacity} personas
💰 Precio: Q${venue.pricePerHour}/hora
🎯 Tipo: ${venue.type}
${venue.amenities ? `✨ Servicios: ${venue.amenities}` : ''}`;
}

export function formatQuoteResult(quote: any): string {
  return `💰 **Cotización Preliminar**
📋 Evento: ${quote.eventType}
👥 Invitados: ${quote.guestCount}
📅 Fecha: ${quote.date}
🏛️ Venue: ${quote.venue}

**Desglose de Costos:**
${quote.items.map((item: any) => `• ${item.description}: Q${item.amount.toLocaleString()}`).join('\n')}

**Total Estimado: Q${quote.total.toLocaleString()}**

*Esta es una cotización preliminar. Para una cotización formal, por favor contacta con nuestro equipo de ventas.*`;
}