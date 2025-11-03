import { NextRequest, NextResponse } from 'next/server';

// Respuestas simuladas para la demo
const DEMO_RESPONSES = {
  'busqueda': {
    message: `🔍 **BÚSQUEDA INTELIGENTE DE EVENTOS COMPLETADA**

He encontrado **2 eventos de boda** en los últimos 3 meses:

📊 **EVENTOS DE BODA RECIENTES:**
1. **Boda García-López** - 2 Oct 2024
   • Venue: Salón Principal
   • Invitados: 140 personas
   • Total: Q15,750
   • Status: Completado ✅

2. **Boda Méndez-Castro** - 28 Sep 2024
   • Venue: Jardín Terraza
   • Invitados: 95 personas
   • Total: Q11,200
   • Status: Completado ✅

📈 **ESTADÍSTICAS AUTOMÁTICAS:**
• Promedio invitados: 117 personas
• Ingreso total: Q26,950
• Venue preferido: Salón Principal (60%)
• Servicios más solicitados: Fotografía (100%), DJ (85%)
• Temporada alta: Septiembre-Octubre

💡 **RECOMENDACIONES:**
- Promocionar Jardín Terraza para bodas íntimas
- Crear paquetes "Boda de Temporada" para sep-oct
- Ampliar servicios de fotografía por alta demanda

¿Te gustaría ver detalles específicos de algún evento o generar un reporte detallado?`,
    processingTime: 1.2,
    confidence: 0.95
  },

  'disponibilidad': {
    message: `📅 **VERIFICACIÓN DE DISPONIBILIDAD COMPLETADA**

✅ **EL SALÓN PRINCIPAL ESTÁ DISPONIBLE**
📅 Fecha: Sábado 15 de febrero 2025

🏛️ **DETALLES DEL ESPACIO:**
• Capacidad: 150 personas (✅ suficiente para 130)
• Precio: Q500/hora
• Incluye: Sistema de sonido, iluminación LED, A/C, proyector
• Ubicación: Planta principal (200 m²)
• Ventajas: Acceso para discapacitados, valet parking

💰 **ESTIMACIÓN PRELIMINAR:**
• Salón (8 horas): Q4,000
• Mobiliario para 130 personas: Q1,950
  - Sillas elegantes: Q1,300
  - Mesas redondas (16): Q650
• **Subtotal espacio**: Q5,950

📋 **SERVICIOS DISPONIBLES PARA ESA FECHA:**
• DJ Profesional: Disponible ✅
• Fotografía Premium: Disponible ✅
• Catering Ejecutivo: Disponible ✅
• Decoración Premium: Disponible ✅

⏰ **POLÍTICA DE RESERVA:**
• Adelanto requerido: 40% (Q2,380)
• Saldo final: 48 horas antes del evento
• Cancelación: Hasta 30 días antes sin penalización

¿Te gustaría que prepare una cotización completa con servicios adicionales?`,
    processingTime: 0.8,
    confidence: 0.98
  },

  'cotizacion': {
    message: `💰 **COTIZACIÓN COMPLETA GENERADA**

📋 **COTIZACIÓN DETALLADA - BODA 130 PERSONAS**
📅 Fecha: Sábado 15 de febrero 2025
🏛️ Venue: Salón Principal

**🏗️ ESPACIO Y MOBILIARIO:**
• Salón Principal (10 horas): Q5,000
• Sillas elegantes (130): Q1,300
• Mesas redondas (16): Q800
• Mantelería premium: Q480
• Decoración básica del espacio: Q600

**🍽️ CATERING EJECUTIVO:**
• Menú ejecutivo 3 tiempos (130 personas): Q7,800
• Bebidas incluidas (vino, cerveza, soft drinks): Q3,900
• Servicio de meseros profesionales (6): Q1,800
• Servicio de bartender: Q800

**🎵 ENTRETENIMIENTO Y SERVICIOS:**
• DJ profesional (6 horas): Q2,500
• Sistema de sonido premium: Q1,200
• Fotografía profesional: Q3,000
• Decoración premium personalizada: Q4,000
• Coordinación del evento: Q1,500

**💎 SERVICIOS ADICIONALES:**
• Iluminación ambiental: Q800
• Servicio de valet parking: Q600
• Seguridad del evento: Q400

**💰 RESUMEN FINANCIERO:**
• Subtotal: Q36,480
• IVA (12%): Q4,378
• **TOTAL: Q40,858**

**🎁 INCLUIDO SIN COSTO ADICIONAL:**
• Noche de cortesía para novios en hotel aliado
• Degustación gratuita del menú (hasta 4 personas)
• Mesa especial para regalos con seguridad
• Música ambiental durante coctel de bienvenida

**📄 TÉRMINOS:**
• Cotización válida hasta: 15 enero 2025
• Adelanto requerido: 40% (Q16,343)
• Saldo final: Q24,515 (48 horas antes)
• Descuento por pago anticipado: 3% si paga total antes del 31 dic

**🎯 EXTRAS OPCIONALES:**
• Flores naturales premium: Q2,500
• Servicio de limousine: Q1,800
• Banda en vivo (4 horas): Q6,000
• Video profesional: Q4,500

¿Deseas ajustar algún servicio o necesitas información adicional sobre algún item específico?`,
    processingTime: 2.1,
    confidence: 0.97
  },

  'cliente': {
    message: `👤 **ANÁLISIS COMPLETO DE CLIENTE**

**📊 PERFIL DE CLIENTE:**
• **Nombre:** María González
• **Empresa:** Constructora González S.A.
• **Tipo:** Cliente Corporativo Premium ⭐
• **Teléfono:** +502 5555-1234
• **Email:** maria.gonzalez@constructora-gonzalez.com
• **Desde:** Enero 2023 (1 año 9 meses)

**💼 HISTORIAL COMERCIAL:**
• **Eventos realizados:** 4 eventos
• **Valor total generado:** Q28,750
• **Promedio por evento:** Q7,187
• **Última actividad:** 15 noviembre 2024
• **Índice de satisfacción:** 9.2/10 ⭐⭐⭐⭐⭐

**📈 EVOLUCIÓN DE GASTO:**
• 2023: Q8,500 (1 evento)
• 2024: Q20,250 (3 eventos) - ↑138% crecimiento

**🎯 PREFERENCIAS IDENTIFICADAS:**
• **Venues preferidos:** Salón Principal (75%), Jardín Terraza (25%)
• **Servicios frecuentes:** Catering ejecutivo, valet parking, A/V profesional
• **Horarios típicos:** Eventos matutinos (8am-2pm) para capacitaciones
• **Temporada alta:** Noviembre-Diciembre (eventos de fin de año)
• **Presupuesto promedio:** Q6,000-Q8,500 por evento

**💡 OPORTUNIDADES DE NEGOCIO:**
1. **Cliente Premium confiable** - 100% historial de pagos puntuales
2. **Patrón predecible** - Evento anual fin de año (alta probabilidad)
3. **Potencial crecimiento** - Empresa en expansión (+38% empleados 2024)
4. **Cross-selling:** Servicios no usados aún:
   - Decoración premium corporativa
   - Streaming/transmisión en vivo
   - Servicios de fotografía corporativa

**🎯 RECOMENDACIONES ESTRATÉGICAS:**
1. **Contacto proactivo:** Llamar en noviembre para evento fin de año
2. **Propuesta especializada:** Paquete corporativo anual con descuento 15%
3. **Upselling:** Ofrecer servicios A/V premium para presentaciones
4. **Fidelización:** Garantizar disponibilidad de valet parking (requisito)
5. **Expansión:** Proponer servicios para inauguraciones/lanzamientos

**📊 ANÁLISIS PREDICTIVO:**
• **Probabilidad evento 2025:** 95% (patrón histórico)
• **Presupuesto estimado:** Q8,500-Q10,000 (crecimiento proyectado)
• **Mejor momento contacto:** Primera semana noviembre
• **ROI potencial cliente:** Q15,000-Q20,000 anuales

**🚨 ALERTAS IMPORTANTES:**
• ⚠️ Mantener relación - cliente de alto valor
• 📅 Recordatorio automático: 1 nov 2024
• 🎁 Considerar regalo corporativo navideño
• 📞 Seguimiento post-evento siempre positivo

¿Te gustaría que prepare una propuesta comercial específica para María González o programar una llamada de seguimiento?`,
    processingTime: 1.5,
    confidence: 0.94
  }
};

function detectScenario(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('boda') && (msg.includes('último') || msg.includes('meses') || msg.includes('recent'))) {
    return 'busqueda';
  }
  
  if (msg.includes('disponib') || msg.includes('salón') || msg.includes('febrero')) {
    return 'disponibilidad';  
  }
  
  if (msg.includes('cotiz') || msg.includes('precio') || msg.includes('catering') || msg.includes('dj')) {
    return 'cotizacion';
  }
  
  if (msg.includes('maría') || msg.includes('cliente') || msg.includes('análisis') || msg.includes('gonzález')) {
    return 'cliente';
  }
  
  // Respuesta por defecto
  return 'busqueda';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }
    
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Detectar escenario basado en el mensaje
    const scenario = detectScenario(message);
    const response = DEMO_RESPONSES[scenario as keyof typeof DEMO_RESPONSES];
    
    return NextResponse.json({
      success: true,
      data: {
        message: response.message,
        conversationId: sessionId || `demo-${Date.now()}`,
        metadata: {
          scenario: scenario,
          processingTime: response.processingTime,
          confidence: response.confidence,
          timestamp: new Date().toISOString(),
          model: 'Demo Agent v1.0'
        }
      }
    });
    
  } catch (error) {
    console.error('Error en chat demo:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
