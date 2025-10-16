# 🗃️ DATOS DE PRUEBA PARA DEMO CASONA

**Propósito:** Datos realistas para demostración del Agente AI  
**Fecha:** 16 de octubre de 2025

---

## 👥 CLIENTES DE PRUEBA

### **1. María González - Empresarial**
```json
{
  "name": "María González",
  "email": "maria.gonzalez@constructora-gonzalez.com",
  "phone": "+502 5555-1234",
  "company": "Constructora González S.A.",
  "type": "Corporativo",
  "events_count": 4,
  "total_spent": 28750,
  "preferred_venues": ["Salón Principal", "Jardín Terraza"],
  "last_event": "2024-11-15",
  "notes": "Cliente Premium - Paga puntualmente. Siempre solicita valet parking."
}
```

### **2. Carlos y Ana Méndez - Social**
```json
{
  "name": "Carlos Méndez",
  "email": "carlos.mendez@email.com", 
  "phone": "+502 5555-2345",
  "company": null,
  "type": "Social",
  "events_count": 1,
  "total_spent": 12500,
  "event_type": "Boda",
  "wedding_date": "2025-02-14",
  "guest_count": 120,
  "notes": "Boda San Valentín. Preferencia por decoración romántica en tonos rosas."
}
```

### **3. Tecnológica Innovar - Corporativo**
```json
{
  "name": "Roberto Silva",
  "email": "eventos@innovar.tech",
  "phone": "+502 5555-3456", 
  "company": "Tecnológica Innovar",
  "type": "Corporativo",
  "events_count": 6,
  "total_spent": 45600,
  "preferred_events": ["Lanzamientos", "Capacitaciones", "Fin de año"],
  "notes": "Empresa tech. Prefieren espacios modernos con buena conectividad."
}
```

---

## 🏛️ VENUES DE CASONA

### **1. Salón Principal**
```json
{
  "name": "Salón Principal",
  "capacity": 150,
  "price_per_hour": 500,
  "amenities": ["Aire acondicionado", "Sistema de sonido", "Iluminación LED", "Proyector"],
  "ideal_for": ["Bodas", "Eventos corporativos", "Quinceañeras"],
  "size": "200 m²",
  "availability": "Alta demanda fines de semana"
}
```

### **2. Jardín Terraza**
```json
{
  "name": "Jardín Terraza", 
  "capacity": 100,
  "price_per_hour": 400,
  "amenities": ["Vista panorámica", "Jardín natural", "Pérgola", "Iluminación exterior"],
  "ideal_for": ["Bodas al aire libre", "Cocteles", "Eventos sociales"],
  "size": "300 m²",
  "weather_dependent": true
}
```

### **3. Salón Ejecutivo**
```json
{
  "name": "Salón Ejecutivo",
  "capacity": 50, 
  "price_per_hour": 300,
  "amenities": ["Mesa boardroom", "Proyector 4K", "WiFi empresarial", "Catering ejecutivo"],
  "ideal_for": ["Reuniones corporativas", "Capacitaciones", "Presentaciones"],
  "size": "80 m²",
  "booking_advance": "Disponible con 24h anticipación"
}
```

---

## 📅 EVENTOS DE EJEMPLO

### **Eventos Completados 2024**

#### **Boda García-López**
```json
{
  "id": "event-001",
  "name": "Boda García-López", 
  "date": "2024-10-02",
  "client": "Patricia García",
  "venue": "Salón Principal",
  "guests": 140,
  "status": "Completado",
  "total": 15750,
  "services": ["Decoración", "DJ", "Fotografía", "Catering"],
  "notes": "Boda elegante. Cliente muy satisfecha con el servicio."
}
```

#### **Lanzamiento Producto TechCorp**
```json
{
  "id": "event-002", 
  "name": "Lanzamiento App TechCorp",
  "date": "2024-09-15",
  "client": "Tecnológica Innovar",
  "venue": "Jardín Terraza",
  "guests": 80,
  "status": "Completado", 
  "total": 8500,
  "services": ["Catering cocktail", "Sonido profesional", "Streaming en vivo"],
  "notes": "Evento innovador con transmisión online. Excelente feedback."
}
```

### **Eventos Próximos 2025**

#### **Boda San Valentín**
```json
{
  "id": "event-003",
  "name": "Boda Méndez-Torres",
  "date": "2025-02-14", 
  "client": "Carlos Méndez",
  "venue": "Salón Principal",
  "guests": 120,
  "status": "Confirmado",
  "estimated_total": 12500,
  "services": ["Decoración romántica", "Música en vivo", "Fotografía"],
  "notes": "Temática San Valentín. Decoración en rosas y rojos."
}
```

#### **Capacitación Anual Constructora**
```json
{
  "id": "event-004",
  "name": "Capacitación Anual 2025",
  "date": "2025-03-20",
  "client": "Constructora González S.A.",
  "venue": "Salón Ejecutivo", 
  "guests": 45,
  "status": "Cotizado",
  "estimated_total": 4200,
  "services": ["Catering empresarial", "Equipo A/V", "Material impreso"],
  "notes": "Capacitación técnica. Requieren proyector de alta definición."
}
```

---

## 💰 COTIZACIONES DE EJEMPLO

### **Cotización Boda 120 Personas**
```json
{
  "event_type": "Boda",
  "guest_count": 120,
  "date": "2025-02-05",
  "venue": "Salón Principal",
  "items": [
    {
      "description": "Salón Principal (8 horas)",
      "quantity": 8,
      "unit_price": 500,
      "total": 4000
    },
    {
      "description": "Sillas elegantes", 
      "quantity": 120,
      "unit_price": 10,
      "total": 1200
    },
    {
      "description": "Mesas redondas (15 mesas)",
      "quantity": 15, 
      "unit_price": 50,
      "total": 750
    },
    {
      "description": "Servicio de meseros",
      "quantity": 6,
      "unit_price": 200, 
      "total": 1200
    },
    {
      "description": "Decoración básica",
      "quantity": 1,
      "unit_price": 1000,
      "total": 1000
    }
  ],
  "subtotal": 8150,
  "iva": 978,
  "total": 9128,
  "valid_until": "2025-01-05"
}
```

### **Cotización Evento Corporativo**
```json
{
  "event_type": "Evento Corporativo",
  "guest_count": 80,
  "date": "2025-04-10", 
  "venue": "Jardín Terraza",
  "items": [
    {
      "description": "Jardín Terraza (6 horas)",
      "quantity": 6,
      "unit_price": 400,
      "total": 2400
    },
    {
      "description": "Setup cocktail",
      "quantity": 80,
      "unit_price": 15,
      "total": 1200
    },
    {
      "description": "Sistema de sonido profesional",
      "quantity": 1,
      "unit_price": 800,
      "total": 800
    },
    {
      "description": "Servicio de bartender",
      "quantity": 2,
      "unit_price": 300,
      "total": 600
    }
  ],
  "subtotal": 5000,
  "iva": 600, 
  "total": 5600,
  "valid_until": "2025-03-10"
}
```

---

## 📊 ESTADÍSTICAS PARA DEMO

### **Métricas 2024**
```json
{
  "total_events": 87,
  "total_revenue": 456780,
  "average_event_value": 5250,
  "top_event_types": [
    {"type": "Bodas", "count": 34, "percentage": 39},
    {"type": "Corporativos", "count": 28, "percentage": 32}, 
    {"type": "Sociales", "count": 15, "percentage": 17},
    {"type": "Quinceañeras", "count": 10, "percentage": 12}
  ],
  "busiest_months": [
    {"month": "Diciembre", "events": 15},
    {"month": "Junio", "events": 12}, 
    {"month": "Noviembre", "events": 10}
  ],
  "venue_utilization": [
    {"venue": "Salón Principal", "percentage": 65},
    {"venue": "Jardín Terraza", "percentage": 25},
    {"venue": "Salón Ejecutivo", "percentage": 10}
  ]
}
```

---

## 🎭 ESCENARIOS DE CONVERSACIÓN

### **Escenario 1: Consulta Simple**
```
👤: "Hola, ¿tienen disponible el salón principal el 15 de diciembre?"

🤖: "¡Hola! Déjame verificar la disponibilidad del Salón Principal para el 15 de diciembre...

✅ **Buenas noticias**: El Salón Principal está disponible el 15 de diciembre.

**Detalles del espacio:**
- Capacidad: 150 personas
- Precio: Q500/hora  
- Incluye: Sistema de sonido, iluminación LED, aire acondicionado
- Tamaño: 200 m²

¿Para qué tipo de evento lo necesitas? Esto me ayudará a darte información más específica sobre servicios adicionales."
```

### **Escenario 2: Búsqueda Compleja**
```
👤: "Necesito ver todos los eventos de bodas que hicimos en el último trimestre"

🤖: "He encontrado **8 eventos de boda** en el último trimestre (Jul-Sep 2024):

**Eventos completados:**
1. **Boda García-López** - 2 Oct - Salón Principal - 140 invitados - Q15,750
2. **Boda Méndez-Castro** - 28 Sep - Jardín Terraza - 95 invitados - Q11,200  
3. **Boda Reyes-Morales** - 21 Sep - Salón Principal - 160 invitados - Q18,500

**Estadísticas del período:**
- Promedio de invitados: 127 personas
- Ingreso total: Q98,450  
- Venue más popular: Salón Principal (62.5%)
- Servicios más solicitados: Fotografía (100%), DJ (87.5%), Decoración premium (75%)

¿Te interesa ver detalles específicos de algún evento o necesitas otro tipo de análisis?"
```

### **Escenario 3: Cotización Compleja**
```
👤: "Dame una cotización completa para una boda de 140 personas el 20 de junio, con catering, música y decoración premium"

🤖: "¡Perfecto! Te preparo una cotización completa para una boda de 140 personas:

**📋 COTIZACIÓN DETALLADA - BODA 140 PERSONAS**
**Fecha:** 20 de junio de 2025 (Viernes)

**🏛️ ESPACIO Y MOBILIARIO:**
- Salón Principal (10 horas): Q5,000
- Sillas elegantes (140): Q1,400
- Mesas redondas (18): Q900
- Mantelería premium: Q540

**🍽️ CATERING (Menú Ejecutivo):**
- Cena servida 3 tiempos: Q8,400 (Q60/persona)
- Bebidas incluidas: Q4,200 (Q30/persona)  
- Servicio de meseros (8): Q2,400

**🎵 ENTRETENIMIENTO:**
- DJ profesional (6 horas): Q2,500
- Sistema de sonido premium: Q1,200
- Iluminación ambiental: Q800

**🎨 DECORACIÓN PREMIUM:**
- Centros de mesa personalizados: Q2,800
- Decoración altar/ceremonia: Q1,500
- Iluminación decorativa: Q1,200

**💰 RESUMEN FINANCIERO:**
- Subtotal: Q32,340
- IVA (12%): Q3,881
- **TOTAL: Q36,221**

**🎁 PROMOCIONES INCLUIDAS:**
- Noche de cortesía para novios en hotel aliado
- Coordinación del evento sin costo adicional
- Degustación gratuita del menú

Esta cotización es válida hasta el 20 de noviembre de 2024.
¿Te gustaría ajustar algún servicio o necesitas información adicional?"
```

---

## 🎪 CHECKLIST PRE-DEMO

### **Configuración Técnica**
- [ ] ✅ Servidor corriendo en localhost:3200
- [ ] Configurar API Key de OpenAI en .env.local
- [ ] Seed de base de datos con los datos de prueba
- [ ] Verificar que todos los endpoints respondan
- [ ] Preparar ventanas/tabs para demo fluida

### **Presentación**
- [ ] Laptop cargada y con backup de batería
- [ ] Proyector/pantalla funcionando
- [ ] Internet estable y backup con hotspot móvil
- [ ] Documentos impresos como respaldo
- [ ] Cronómetro para timing de secciones

### **Contenido**
- [ ] Datos de prueba realistas cargados
- [ ] Escenarios de conversación preparados
- [ ] Respuestas a preguntas frecuentes
- [ ] Ejemplos de ROI y beneficios cuantificados
- [ ] Plan B si algo falla técnicamente

---

🎯 **DATOS DE DEMO LISTOS**  
📊 **Contenido:** Clientes, eventos, venues y cotizaciones realistas  
⚡ **Objetivo:** Demostración impactante y convincente para Casona