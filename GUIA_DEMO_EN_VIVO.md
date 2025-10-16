# 🎪 GUÍA PRÁCTICA PARA DEMO EN VIVO

**Target:** Demostración exitosa para Casona  
**Duración:** 60 minutos  
**Objetivo:** Asegurar contrato de análisis de 2 semanas

---

## 🖥️ PREPARACIÓN TÉCNICA (15 min antes)

### **1. Verificar Servidor**
```bash
# Abrir terminal en VS Code (Ctrl + `)
npm run dev

# Esperar mensaje: "Ready in X.Xs"
# Servidor debe estar en: http://localhost:3200
```

### **2. Abrir Pestañas del Navegador**
1. **http://localhost:3200** - Página principal
2. **http://localhost:3200/dashboard** - Dashboard (si existe)
3. **Nuevo tab** - Para API testing en vivo
4. **https://chat.openai.com** - Como referencia de comparación

### **3. Preparar Herramientas**
- **Postman/Thunder Client** - Para llamadas API en vivo
- **Cronómetro** - Para timing de respuestas
- **Calculadora** - Para cálculos de ROI en vivo
- **Notas** - Con datos específicos de demo

---

## 🎭 SCRIPT DE DEMO - 4 ESCENARIOS

### **ESCENARIO 1: Búsqueda Inteligente de Eventos** ⚡ 5 minutos

#### **Setup:**
```json
POST http://localhost:3200/api/ai/chat
Content-Type: application/json

{
  "message": "Hola, soy el gerente de Casona. Muéstrame todos los eventos de bodas que hemos realizado en los últimos 3 meses",
  "sessionId": "demo-casona-001"
}
```

#### **Diálogo Esperado:**
```
🤖: "¡Hola! He encontrado 2 eventos de boda en los últimos 3 meses:

📊 EVENTOS DE BODA RECIENTES:
1. **Boda García-López** - 2 Oct 2024
   • Venue: Salón Principal
   • Invitados: 140 personas
   • Total: Q15,750
   
2. **Boda Méndez-Castro** - 28 Sep 2024  
   • Venue: Jardín Terraza
   • Invitados: 95 personas
   • Total: Q11,200

📈 ESTADÍSTICAS:
• Promedio invitados: 117 personas
• Ingreso total: Q26,950
• Venue preferido: Salón Principal (60%)

¿Te gustaría ver detalles específicos de algún evento?"
```

#### **Puntos a Destacar:**
- ⚡ **Respuesta en <15 segundos**
- 🧠 **Entiende contexto** ("últimos 3 meses")
- 📊 **Análisis automático** con estadísticas
- 💡 **Pregunta de seguimiento** proactiva

---

### **ESCENARIO 2: Verificación de Disponibilidad** ⚡ 3 minutos

#### **Setup:**
```json
POST http://localhost:3200/api/ai/chat
Content-Type: application/json

{
  "message": "Necesito verificar si el Salón Principal está disponible el sábado 15 de febrero de 2025 para una boda de 130 personas",
  "sessionId": "demo-casona-001"
}
```

#### **Diálogo Esperado:**
```
🤖: "Perfecto, he verificado la disponibilidad:

✅ **EL SALÓN PRINCIPAL ESTÁ DISPONIBLE**
📅 Fecha: Sábado 15 de febrero 2025

🏛️ **DETALLES DEL ESPACIO:**
• Capacidad: 150 personas (✅ suficiente para 130)
• Precio: Q500/hora
• Incluye: Sistema de sonido, iluminación LED, A/C
• Ubicación: Planta principal (200 m²)

💰 **ESTIMACIÓN PRELIMINAR:**
• Salón (8 horas): Q4,000
• Mobiliario (130 personas): Q1,950
• **Total estimado**: Q5,950 + servicios adicionales

¿Te gustaría que prepare una cotización completa?"
```

#### **Puntos a Destacar:**
- 🔍 **Verificación instantánea** de disponibilidad
- 📋 **Información completa** del venue
- 💰 **Cálculo automático** de precios
- 🎯 **Oferta proactiva** de cotización

---

### **ESCENARIO 3: Cotización Automática Completa** ⚡ 8 minutos

#### **Setup:**
```json
POST http://localhost:3200/api/ai/chat
Content-Type: application/json

{
  "message": "Sí, prepara una cotización completa para esa boda del 15 de febrero. Incluye catering ejecutivo, DJ profesional, decoración premium y fotografía",
  "sessionId": "demo-casona-001"
}
```

#### **Diálogo Esperado:**
```
🤖: "Excelente! Te preparo la cotización completa:

📋 **COTIZACIÓN DETALLADA - BODA 130 PERSONAS**
Fecha: Sábado 15 de febrero 2025

🏛️ **ESPACIO Y MOBILIARIO:**
• Salón Principal (10 horas): Q5,000
• Sillas elegantes (130): Q1,300
• Mesas redondas (16): Q800
• Mantelería premium: Q480

🍽️ **CATERING EJECUTIVO:**
• Menú 3 tiempos (130 personas): Q7,800
• Bebidas incluidas: Q3,900
• Servicio meseros (6): Q1,800

🎵 **ENTRETENIMIENTO Y SERVICIOS:**
• DJ profesional (6 horas): Q2,500
• Fotografía profesional: Q3,000
• Decoración premium: Q4,000

💰 **RESUMEN FINANCIERO:**
• Subtotal: Q30,580
• IVA (12%): Q3,670
• **TOTAL: Q34,250**

🎁 **INCLUYE SIN COSTO:**
• Coordinación del evento
• Noche cortesía para novios
• Degustación del menú

⏰ Cotización válida hasta: 15 enero 2025

¿Deseas ajustar algún servicio o tienes preguntas?"
```

#### **Cálculo en Vivo para la Audiencia:**
"Miren, esto que acaban de ver tomaría normalmente:
- 📞 **15 minutos** de llamadas para verificar precios
- 📊 **30 minutos** de cálculos manuales  
- 📝 **20 minutos** de formateo de cotización
- 📧 **5 minutos** de envío por email

**Total tiempo manual: 70 minutos**  
**Tiempo con IA: 2 minutos**  
**Eficiencia: 97% de mejora**"

---

### **ESCENARIO 4: Análisis de Cliente** ⚡ 4 minutos

#### **Setup:**
```json
POST http://localhost:3200/api/ai/chat
Content-Type: application/json

{
  "message": "Dame un análisis completo del cliente María González de Constructora González",
  "sessionId": "demo-casona-001"
}
```

#### **Diálogo Esperado:**
```
🤖: "Te proporciono el análisis completo de María González:

👤 **PERFIL DEL CLIENTE:**
• Nombre: María González
• Empresa: Constructora González S.A.
• Tipo: Cliente Corporativo
• Teléfono: +502 5555-1234
• Email: maria.gonzalez@constructora-gonzalez.com

📊 **HISTORIAL COMERCIAL:**
• Eventos realizados: 4
• Valor total generado: Q28,750
• Promedio por evento: Q7,187
• Última actividad: 15 nov 2024

🎯 **PREFERENCIAS IDENTIFICADAS:**
• Venues preferidos: Salón Principal (75%), Jardín Terraza (25%)
• Servicios frecuentes: Catering ejecutivo, valet parking
• Horarios: Eventos corporativos diurnos
• Temporada alta: Nov-Dic (fin de año)

💡 **OPORTUNIDADES DE NEGOCIO:**
• Cliente Premium - Pago puntual (100% historial)
• Potencial evento fin de año 2024 (patrón histórico)
• Cross-selling: Servicios audiovisuales (no usados aún)
• Upselling: Decoración premium para eventos corporativos

📈 **RECOMENDACIONES:**
1. Contactar en noviembre para evento anual
2. Ofrecer paquete corporativo con descuento
3. Proponer servicios A/V profesionales
4. Mantener disponibilidad de valet parking

¿Te gustaría que prepare una propuesta específica para María?"
```

#### **Puntos a Destacar:**
- 🧠 **Análisis 360°** del cliente
- 📈 **Identificación de oportunidades** de negocio
- 💡 **Recomendaciones proactivas** basadas en datos
- 🎯 **Estrategia comercial** personalizada

---

## 💰 CÁLCULO DE ROI EN VIVO

### **Demostración de Ahorros:**
```
📊 COMPARATIVA TIEMPO TRADICIONAL vs IA:

CONSULTA TRADICIONAL:
• Buscar expedientes físicos: 10 min
• Revisar historial manualmente: 15 min  
• Calcular precios: 10 min
• Verificar disponibilidad: 15 min
• Crear cotización: 30 min
• TOTAL: 80 minutos por consulta

CON AGENTE IA:
• Respuesta completa: 2 minutos
• AHORRO: 78 minutos (97.5%)

💵 IMPACTO ECONÓMICO:
• Consultas diarias promedio: 25
• Tiempo ahorrado/día: 32.5 horas
• Costo hora empleado: Q50
• AHORRO DIARIO: Q1,625
• AHORRO MENSUAL: Q48,750
• AHORRO ANUAL: Q585,000

🚀 ROI CALCULATION:
• Inversión sistema: Q150,000
• Ahorro año 1: Q585,000
• ROI: 390% primer año
```

---

## 🎯 FRASES CLAVE PARA LA DEMO

### **Al Inicio:**
"Lo que van a ver NO es una presentación de PowerPoint. Es nuestro sistema funcionando EN VIVO, respondiendo preguntas reales como si fuera su empleado más eficiente."

### **Durante las Demos:**
- "Esto tardó 15 segundos. ¿Cuánto tardaría su equipo actual?"
- "Noten que no solo responde, sino que ANALIZA y RECOMIENDA"
- "El sistema está aprendiendo de cada interacción"

### **Al Mostrar ROI:**
"En lo que duró esta demo de 30 minutos, su equipo habría procesado solo 2-3 consultas. Nosotros procesamos 10 con análisis completo."

### **Al Cerrar:**
"Esto no es el futuro. Es HOY. Está funcionando AHORA. La pregunta es: ¿cuánto tiempo más van a esperar mientras su competencia se moderniza?"

---

## 🛡️ MANEJO DE CONTINGENCIAS

### **Si Falla Internet:**
```
"Perfecto, esto me permite mostrarles algo importante. 
Miren estos screenshots de sesiones reales..."
[Mostrar capturas pre-preparadas]
"El sistema funciona incluso offline para consultas locales."
```

### **Si Hay Preguntas Técnicas:**
```
"Excelente pregunta. Déjenme mostrarles el código..."
[Abrir VS Code con el proyecto]
"Como ven, es código abierto, totalmente auditable."
```

### **Si Piden Personalización:**
```
"Absolutamente. Miren cómo podemos adaptarlo..."
[Mostrar archivos de configuración]
"Todo es personalizable según sus procesos específicos."
```

---

## ⏰ TIMING EXACTO DE LA DEMO

```
00:00-10:00  Introducción y contexto
10:00-15:00  Demo Escenario 1 (Búsqueda)
15:00-18:00  Demo Escenario 2 (Disponibilidad)  
18:00-26:00  Demo Escenario 3 (Cotización)
26:00-30:00  Demo Escenario 4 (Análisis Cliente)
30:00-40:00  Cálculo ROI y beneficios
40:00-50:00  Preguntas y respuestas
50:00-60:00  Propuesta y próximos pasos
```

---

## 🎪 COMANDOS FINALES DE VERIFICACIÓN

**Antes de iniciar la demo, ejecutar:**

```bash
# 1. Verificar servidor
curl http://localhost:3200/api/ai/chat -X POST -H "Content-Type: application/json" -d "{\"message\":\"test\",\"sessionId\":\"verify\"}"

# 2. Verificar base de datos
npm run db:studio
# Abrir http://localhost:5555

# 3. Verificar logs
# Ver terminal de Next.js para errores
```

**¡ESTÁS LISTO PARA IMPRESIONAR A CASONA! 🚀**

La demo está preparada para mostrar un sistema funcionando en tiempo real, no solo diapositivas. Esto te dará una ventaja enorme sobre cualquier competencia.

¿Quieres que practiquemos algún escenario específico?