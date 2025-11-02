
import pypandoc
import os

markdown_content = """
# 🎯 PROPUESTA COMERCIAL - PLEXO
## Sistema de Gestión Integral para Salones de Eventos

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Situación Actual](#análisis-de-situación-actual)
3. [Solución Propuesta: PLEXO](#solución-propuesta-plexo)
4. [Módulos y Características](#módulos-y-características)
5. [Ventajas sobre Excel y Sistemas Tradicionales](#ventajas-sobre-excel)
6. [Inversión y Planes](#inversión-y-planes)
7. [Implementación y Soporte](#implementación-y-soporte)
8. [ROI y Beneficios Esperados](#roi-y-beneficios)

---

## 🎯 RESUMEN EJECUTIVO

**PLEXO** es un sistema de gestión integral diseñado específicamente para la administración completa de salones de eventos, salones de fiestas y centros de eventos. A diferencia de soluciones genéricas o hojas de cálculo, PLEXO está construido desde cero para resolver los desafíos únicos de este sector.

### Problema Identificado
Tras un análisis exhaustivo de sus operaciones, hemos identificado que actualmente no cuentan con un control completo y centralizado de:
- **Rentas de salones**: Disponibilidad, reservas, conflictos de horario
- **Gestión de clientes**: Historial, preferencias, seguimiento post-evento
- **Cotizaciones y pagos**: Versionado, aprobaciones, cobranza
- **Inventario de servicios**: Paquetes, precios, disponibilidad de recursos
- **Métricas y reportes**: Análisis de rentabilidad, ocupación, tendencias

### Solución
PLEXO centraliza toda la operación en una plataforma moderna, accesible desde cualquier dispositivo, con inteligencia artificial integrada y automatización de procesos clave.

---

## 📊 ANÁLISIS DE SITUACIÓN ACTUAL

### 🔴 Problemática Detectada

#### 1. **Gestión Manual y Dispersa**
- Información en múltiples hojas de Excel sin sincronización
- Riesgo de doble reserva por falta de visibilidad en tiempo real
- Pérdida de datos críticos por archivos corruptos o no respaldados
- Imposibilidad de trabajar colaborativamente (múltiples usuarios simultáneos)

#### 2. **Control Limitado de Rentas**
- No hay un calendario visual de disponibilidad
- Difícil identificar patrones de ocupación (días/horas más rentables)
- Complicado hacer proyecciones de ingresos
- No se registra historial completo de modificaciones

#### 3. **Proceso de Cotización Ineficiente**
- Cotizaciones manuales con riesgo de errores de cálculo
- Sin control de versiones (cliente solicita cambios)
- No hay seguimiento automatizado del estatus (enviada, vista, aceptada)
- Imposible saber tasa de conversión de cotizaciones a ventas

#### 4. **Experiencia del Cliente Limitada**
- Cliente debe llamar/escribir para consultar disponibilidad
- No recibe confirmaciones automáticas
- Sin portal de auto-gestión para ver su evento
- Comunicación fragmentada por WhatsApp, email, llamadas

#### 5. **Reportes y Métricas Inexistentes**
- No se pueden generar reportes de ocupación por periodo
- Imposible medir rentabilidad por tipo de evento
- Sin análisis de servicios más vendidos
- Toma de decisiones basada en intuición, no en datos

### 💰 Impacto en el Negocio

| Problema | Impacto Financiero Estimado |
|----------|---------------------------|
| Doble reservas / Cancelaciones | 5-10% de ingresos perdidos anualmente |
| Tiempo en cotizaciones manuales | 15-20 horas/semana de trabajo administrativo |
| Errores en cálculos de precios | 3-5% de márgenes de ganancia perdidos |
| Clientes perdidos por mala experiencia | 10-15% de tasa de abandono |
| Falta de seguimiento post-cotización | 20-30% de conversión perdida |

**Total estimado de pérdidas: 30-40% de potencial de ingresos no capitalizado**

---

## ✨ SOLUCIÓN PROPUESTA: PLEXO

### Arquitectura de la Solución

PLEXO es una plataforma **SaaS (Software as a Service)** o **On-Premise** que centraliza toda la gestión del negocio en una interfaz moderna e intuitiva.

#### Características Técnicas Clave

1. **Multi-Tenant (Multi-Organización)**
   - Cada cliente tiene su espacio completamente aislado
   - Datos encriptados y respaldados automáticamente
   - Cumplimiento con normativas de protección de datos

2. **Accesibilidad Total**
   - Web responsive (funciona en PC, tablet, smartphone)
   - Sin necesidad de instalar software
   - Acceso 24/7 desde cualquier lugar con internet

3. **Inteligencia Artificial Integrada**
   - Asistente virtual para consultas de clientes
   - Generación automática de cotizaciones
   - Análisis predictivo de demanda
   - Soporte: OpenAI GPT-4 o Google Gemini

4. **Automatización de Procesos**
   - Emails y notificaciones automáticas
   - Recordatorios de pagos
   - Alertas de conflictos de horario
   - Generación de documentos (contratos, recibos)

---

## 🧩 MÓDULOS Y CARACTERÍSTICAS

### 📅 **1. MÓDULO DE CALENDARIO Y RESERVAS**

#### Características:
- ✅ **Calendario visual interactivo** (vista día/semana/mes)
- ✅ **Gestión de disponibilidad en tiempo real**
- ✅ **Detección automática de conflictos de horario**
- ✅ **Múltiples salones/espacios** (gestión independiente)
- ✅ **Reservas con estados**: Cotizada, Reservada, Confirmada, En Progreso, Completada, Cancelada
- ✅ **Bloqueos de mantenimiento** o eventos internos
- ✅ **Vista de ocupación por periodo** (estadísticas)

#### Beneficios:
- ⚡ Reducción de doble reservas a 0%
- ⚡ Visibilidad instantánea de disponibilidad
- ⚡ Planificación estratégica de recursos

---

### 👥 **2. MÓDULO DE GESTIÓN DE CLIENTES (CRM)**

#### Características:
- ✅ **Base de datos centralizada de clientes**
- ✅ **Historial completo** (eventos pasados, cotizaciones, pagos)
- ✅ **Clasificación por tipo**: Corporativo, Social, Recurrente
- ✅ **Notas y observaciones** (preferencias, alergias, etc.)
- ✅ **Portal del cliente** (auto-gestión, ver su evento, documentos)
- ✅ **Comunicación integrada** (email, WhatsApp, SMS)
- ✅ **Seguimiento automático** post-cotización

#### Beneficios:
- 💼 Experiencia personalizada para cada cliente
- 💼 Aumento de clientes recurrentes (+25%)
- 💼 Reducción de tiempo de atención (-40%)

---

### 💰 **3. MÓDULO DE COTIZACIONES Y VENTAS**

#### Características:
- ✅ **Generador de cotizaciones inteligente**
- ✅ **Control de versiones** (histórico de cambios)
- ✅ **Plantillas personalizables** por tipo de evento
- ✅ **Cálculo automático** (subtotales, descuentos, impuestos)
- ✅ **Envío por email** con tracking (vista/abierta)
- ✅ **Firma electrónica** de aceptación
- ✅ **Conversión automática** a evento confirmado
- ✅ **Generación de asistente IA** (basado en conversación)

#### Beneficios:
- 📈 Reducción de tiempo en cotizaciones (-70%)
- 📈 Tasa de conversión mejorada (+30%)
- 📈 Errores de cálculo eliminados (100%)

---

### 📦 **4. MÓDULO DE PAQUETES Y SERVICIOS**

#### Características:
- ✅ **Catálogo de servicios** (menús, decoración, equipo)
- ✅ **Paquetes predefinidos** y personalizables
- ✅ **Gestión de precios** (listas por temporada, tipo de evento)
- ✅ **Control de inventario** (disponibilidad de recursos)
- ✅ **Proveedores externos** (catering, DJ, fotografía)
- ✅ **Costos vs Precio de venta** (análisis de margen)

#### Beneficios:
- 📊 Visibilidad de rentabilidad por servicio
- 📊 Optimización de márgenes de ganancia
- 📊 Control de costos operativos

---

### 💳 **5. MÓDULO DE PAGOS Y COBRANZA**

#### Características:
- ✅ **Gestión de anticipos y pagos parciales**
- ✅ **Integración con Mercado Pago** (pagos en línea)
- ✅ **Recordatorios automáticos** de pagos pendientes
- ✅ **Recibos digitales** generados automáticamente
- ✅ **Histórico de transacciones** por cliente/evento
- ✅ **Reportes de cobranza** (pendientes, vencidos, pagados)
- ✅ **Dashboard de flujo de caja**

#### Beneficios:
- 💵 Reducción de morosidad (-50%)
- 💵 Mejor flujo de caja (visibilidad)
- 💵 Automatización de cobranza

---

### 📱 **6. MÓDULO DE COMUNICACIÓN MULTICANAL**

#### Características:
- ✅ **WhatsApp Business integrado**
- ✅ **Email marketing** (confirmaciones, recordatorios)
- ✅ **SMS para notificaciones críticas**
- ✅ **Chatbot con IA** (atención 24/7)
- ✅ **Plantillas de mensajes** personalizables
- ✅ **Historial de conversaciones** por cliente

#### Beneficios:
- 📞 Atención 24/7 sin costo adicional de personal
- 📞 Respuestas instantáneas a consultas frecuentes
- 📞 Mejora en satisfacción del cliente (+40%)

---

### 📊 **7. MÓDULO DE REPORTES Y ANALYTICS**

#### Características:
- ✅ **Dashboard ejecutivo** (KPIs principales)
- ✅ **Reportes de ocupación** (por sala, día, mes, año)
- ✅ **Análisis de rentabilidad** (por evento, servicio, periodo)
- ✅ **Tendencias y proyecciones** (IA predictiva)
- ✅ **Exportación a Excel/PDF**
- ✅ **Comparativas año vs año**
- ✅ **Reportes personalizados**

#### Métricas Disponibles:
- 📈 Tasa de ocupación por sala
- 📈 Ingreso promedio por evento
- 📈 Tasa de conversión de cotizaciones
- 📈 Servicios más vendidos
- 📈 Clientes más rentables
- 📈 Horas pico / Temporadas altas

#### Beneficios:
- 🎯 Decisiones basadas en datos reales
- 🎯 Identificación de oportunidades de crecimiento
- 🎯 Optimización de recursos y personal

---

### 👥 **8. MÓDULO DE ADMINISTRACIÓN Y USUARIOS**

#### Características:
- ✅ **Sistema de roles y permisos**
  - Super Admin: Control total del sistema
  - Administrador de Sede: Gestión de su localización
  - Manager: Operaciones y ventas
  - Usuario: Consultas y tareas asignadas
- ✅ **Auditoría completa** (quién hizo qué y cuándo)
- ✅ **Multi-sede** (franquicias o múltiples locales)
- ✅ **Configuración personalizable** (colores, logos, términos)

#### Beneficios:
- 🔐 Seguridad y trazabilidad total
- 🔐 Control granular de accesos
- 🔐 Escalabilidad para crecimiento

---

### 🤖 **9. ASISTENTE VIRTUAL CON IA (AGENTE CRM)**

#### Características:
- ✅ **Conversación natural** (como hablar con un asesor)
- ✅ **Consulta de disponibilidad** ("¿Tienen libre el 15 de diciembre?")
- ✅ **Generación de cotizaciones** ("Necesito un salón para 100 personas")
- ✅ **Respuestas personalizadas** basadas en historial
- ✅ **Aprendizaje continuo** (mejora con cada interacción)
- ✅ **Soporte en múltiples idiomas** (español/inglés)
- ✅ **Integrado en WhatsApp y Web**

#### Ejemplo de Conversación:
'''
Cliente: "Hola, necesito un salón para una boda de 150 personas en junio"
IA: "¡Con gusto! Tenemos disponibilidad en junio. ¿Qué fecha específica 
     buscas? También, ¿prefieres eventos diurnos o nocturnos?"
Cliente: "Sábado 14 de junio en la noche"
IA: "Perfecto, el Salón Diamante está disponible (cap. 200 personas). 
     ¿Te interesa incluir catering, decoración o solo la renta del salón?"
Cliente: "¿Cuánto costaría con catering y decoración básica?"
IA: "Generando cotización personalizada... 
     - Salón Diamante: $15,000
     - Catering 150 pax: $22,500
     - Decoración básica: $8,000
     TOTAL: $45,500 MXN
     ¿Te envío la cotización detallada por email?"
'''

#### Beneficios:
- 🤖 80% de consultas resueltas sin intervención humana
- 🤖 Tiempo de respuesta: <1 minuto (vs. horas)
- 🤖 Disponibilidad 24/7/365
- 🤖 Generación de leads automática

---

## ⚖️ VENTAJAS SOBRE EXCEL Y SISTEMAS TRADICIONALES

### 🔴 Desventajas de Excel

| Problema | Impacto |
|----------|---------|
| **Sin trabajo colaborativo** | Solo una persona puede editar a la vez |
| **Sin respaldos automáticos** | Riesgo de pérdida total de datos |
| **Propenso a errores** | Fórmulas rotas, datos sobrescritos |
| **Sin control de versiones** | No se sabe quién cambió qué |
| **Escalabilidad limitada** | Archivos lentos con muchos datos |
| **Sin automatización** | Todo proceso es manual |
| **Acceso limitado** | Solo en la PC donde está guardado |
| **Sin seguridad** | Cualquiera puede copiar/modificar |
| **Sin integraciones** | Aislado de otros sistemas |
| **Sin reportes visuales** | Gráficos básicos y poco intuitivos |

### ✅ Ventajas de PLEXO

| Característica | Beneficio |
|----------------|-----------|
| **Cloud / Web** | Acceso desde cualquier dispositivo, en cualquier lugar |
| **Multi-usuario** | 10+ usuarios trabajando simultáneamente |
| **Respaldos automáticos** | Datos seguros con backups cada hora |
| **Auditoría completa** | Registro de todos los cambios (quién, qué, cuándo) |
| **Validaciones inteligentes** | Imposible crear conflictos de horario |
| **Automatización total** | Emails, notificaciones, recordatorios sin intervención |
| **Integraciones** | WhatsApp, Email, Mercado Pago, Facturación |
| **Seguridad enterprise** | Encriptación, roles, permisos granulares |
| **Analytics con IA** | Predicciones, tendencias, recomendaciones |
| **Actualizaciones continuas** | Nuevas funciones sin costo adicional |
| **Soporte técnico** | Equipo dedicado para resolver incidencias |
| **Experiencia del cliente** | Portal moderno, app móvil, chatbot |

### 📈 Comparativa de Eficiencia

| Tarea | Excel | PLEXO | Ahorro |
|-------|-------|-------|--------|
| Crear cotización | 15-20 min | 2-3 min | **85%** |
| Verificar disponibilidad | 5-10 min | 5 segundos | **95%** |
| Generar reporte mensual | 2-3 horas | 30 segundos | **99%** |
| Enviar confirmación a cliente | 10 min manual | Automático | **100%** |
| Calcular ingresos proyectados | 1 hora | Tiempo real | **100%** |
| Seguimiento post-cotización | No existe | Automático | **∞** |

**Tiempo total ahorrado: ~20 horas semanales = 1 empleado de tiempo completo**

---

## 💰 INVERSIÓN Y PLANES

### Modalidad 1️⃣: **COMPRA DE LICENCIA PERPETUA**

Inversión única + mantenimiento anual

#### Costos de Desarrollo e Implementación

| Concepto | Descripción | Inversión (MXN) |
|----------|-------------|-----------------|
| **Análisis y Diseño** | Levantamiento de requerimientos, diseño UX/UI, arquitectura técnica | $80,000 |
| **Desarrollo Backend** | API REST, base de datos, lógica de negocio, seguridad | $250,000 |
| **Desarrollo Frontend** | Interfaces web responsive, dashboard, formularios | $180,000 |
| **Integración IA** | Asistente virtual, chatbot, generación automática de cotizaciones | $120,000 |
| **Integraciones Externas** | WhatsApp Business, Email, Mercado Pago, SMS | $90,000 |
| **Testing y QA** | Pruebas funcionales, de carga, seguridad, UAT | $60,000 |
| **Capacitación** | 3 sesiones de 4 horas con todo el equipo | $25,000 |
| **Migración de Datos** | Importación de Excel/sistemas anteriores | $35,000 |
| **Implementación y Puesta en Marcha** | Configuración, personalización, go-live | $40,000 |

**SUBTOTAL DESARROLLO:** $880,000 MXN

#### Costos Anuales de Mantenimiento

| Concepto | Descripción | Inversión Anual (MXN) |
|----------|-------------|-----------------------|
| **Soporte Técnico** | Email, teléfono, acceso remoto (8x5) | $60,000 |
| **Actualizaciones y Mejoras** | Nuevas funciones, parches de seguridad | $48,000 |
| **Respaldos y Seguridad** | Backups, monitoreo, auditorías | $24,000 |
| **Hosting y Mantenimiento** | Servidores, bases de datos, CDN | $36,000 |

**SUBTOTAL ANUAL:** $168,000 MXN

#### 📊 Resumen Licencia Perpetua

| Concepto | Año 1 | Años Subsecuentes |
|----------|-------|-------------------|
| Inversión Inicial | $880,000 | - |
| Mantenimiento Anual | $168,000 | $168,000 |
| **TOTAL** | **$1,048,000** | **$168,000/año** |

✅ **Incluye:**
- Código fuente
- Licencia perpetua (sin límite de tiempo)
- Usuarios ilimitados
- Eventos ilimitados
- Actualizaciones por 1 año
- Soporte técnico por 1 año

❌ **NO Incluye:**
- Infraestructura (servidor/VPS: ~$3,000-8,000/mes)
- Costos de WhatsApp Business API (~$0.05-0.15/mensaje)
- Costos de IA (OpenAI ~$20-100/mes o Gemini ~$10-50/mes)
- Comisiones Mercado Pago (3.99% + $4 por transacción)
- Dominio y SSL (~$1,500/año)

---

### Modalidad 2️⃣: **SUSCRIPCIÓN ANUAL (SaaS)**

Pago anual sin inversión inicial alta

#### Plan Profesional

| Concepto | Descripción | Inversión Anual (MXN) |
|----------|-------------|-----------------------|
| **Licencia Anual** | Acceso completo a la plataforma | $180,000 |
| **Implementación** | Setup inicial, migración de datos, capacitación | $45,000 |
| **Soporte Premium** | Soporte 24/7, actualizaciones incluidas | Incluido |
| **Hosting y Respaldos** | Infraestructura administrada | Incluido |

**TOTAL AÑO 1:** $225,000 MXN  
**RENOVACIÓN ANUAL:** $180,000 MXN

✅ **Incluye:**
- Hasta 10 usuarios concurrentes
- 3 salones/espacios
- Eventos ilimitados
- 5,000 mensajes WhatsApp/mes
- 10,000 créditos IA/mes
- Almacenamiento 50 GB
- Respaldos diarios automáticos
- Actualizaciones continuas
- Soporte 24/7 (email/chat)
- Infraestructura incluida
- SSL y dominio incluidos

❌ **NO Incluye:**
- Comisiones Mercado Pago (3.99% + $4)
- WhatsApp adicional ($0.05/mensaje extra)
- Créditos IA adicionales ($0.002/solicitud extra)

#### Plan Enterprise (Escalable)

Para múltiples sedes o alto volumen

**Desde $350,000 MXN/año**

✅ Incluye todo lo del Plan Profesional, más:
- Usuarios ilimitados
- Salones/sedes ilimitadas
- 20,000 mensajes WhatsApp/mes
- 50,000 créditos IA/mes
- Almacenamiento 200 GB
- Personalización de marca (white label)
- Integraciones personalizadas
- Soporte dedicado con SLA
- Capacitación trimestral

---

### Modalidad 3️⃣: **DESARROLLO A MEDIDA**

Si requieren funciones específicas no contempladas

**Desde $1,200,000 MXN**

Incluye análisis completo, desarrollo personalizado, y soporte extendido

---

## 🚀 IMPLEMENTACIÓN Y SOPORTE

### Cronograma de Implementación

#### Fase 1: Análisis y Diseño (3 semanas)
- ✅ Levantamiento de requerimientos detallado
- ✅ Diseño de flujos de trabajo personalizados
- ✅ Mockups y prototipos de interfaces
- ✅ Aprobación del cliente

#### Fase 2: Desarrollo (8-10 semanas)
- ✅ Desarrollo de módulos core
- ✅ Integraciones con servicios externos
- ✅ Implementación de IA
- ✅ Pruebas internas continuas

#### Fase 3: Testing y Ajustes (2 semanas)
- ✅ Pruebas funcionales completas
- ✅ Pruebas de usuario (UAT)
- ✅ Corrección de bugs
- ✅ Optimización de rendimiento

#### Fase 4: Capacitación (1 semana)
- ✅ Sesión 1: Administradores (4 horas)
- ✅ Sesión 2: Usuarios operativos (4 horas)
- ✅ Sesión 3: Reportes y analytics (3 horas)
- ✅ Documentación y manuales

#### Fase 5: Migración de Datos (1 semana)
- ✅ Importación de datos históricos
- ✅ Validación de integridad
- ✅ Pruebas de migración

#### Fase 6: Go-Live y Acompañamiento (2 semanas)
- ✅ Puesta en producción
- ✅ Monitoreo intensivo
- ✅ Soporte on-site (si se requiere)
- ✅ Ajustes post-lanzamiento

**TIEMPO TOTAL: 16-18 semanas (~4 meses)**

---

### Plan de Soporte

#### Soporte Estándar (Incluido en Suscripción)
- 📧 Email: Respuesta en 24 horas hábiles
- 💬 Chat: Respuesta en 4 horas hábiles
- ⏰ Horario: Lunes a Viernes 9:00-18:00
- 📚 Base de conocimientos online
- 🎥 Videotutoriales

#### Soporte Premium (Opcional: +$30,000/año)
- 📞 Teléfono: Atención inmediata
- 💬 Chat: Respuesta en 1 hora
- ⏰ Horario: 24/7/365
- 🖥️ Acceso remoto para resolución
- 👨‍💻 Ingeniero dedicado
- 📊 Reportes mensuales de uso

#### SLA (Service Level Agreement)

| Prioridad | Tiempo de Respuesta | Tiempo de Resolución |
|-----------|---------------------|----------------------|
| Crítica (Sistema caído) | 1 hora | 4 horas |
| Alta (Funcionalidad clave afectada) | 4 horas | 24 horas |
| Media (Problema menor) | 24 horas | 72 horas |
| Baja (Consulta/Mejora) | 48 horas | A convenir |

---

## 📈 ROI Y BENEFICIOS ESPERADOS

### Retorno de Inversión Proyectado

#### Ahorro Operativo Anual

| Concepto | Ahorro Estimado (MXN/año) |
|----------|---------------------------|
| **Reducción de tiempo administrativo** (20 hrs/semana × $150/hr × 52 semanas) | $156,000 |
| **Eliminación de doble reservas y conflictos** (5% de ingresos recuperados) | $180,000* |
| **Mejora en tasa de conversión de cotizaciones** (+30% conversión) | $240,000* |
| **Reducción de morosidad** (50% mejora en cobranza) | $120,000* |
| **Optimización de recursos y compras** (10% reducción costos) | $90,000* |
| **Clientes recurrentes** (+25% retención) | $200,000* |

**AHORRO TOTAL ESTIMADO: $986,000 MXN/año**

*Basado en ingresos anuales promedio de $3,600,000 MXN para un salón de eventos mediano

#### ROI por Modalidad

##### Licencia Perpetua
- Inversión Año 1: $1,048,000
- Ahorro Año 1: $986,000
- **Payback: 13 meses**
- ROI 3 años: **182%**

##### Suscripción Anual
- Inversión Año 1: $225,000
- Ahorro Año 1: $986,000
- **Payback: 2.7 meses**
- ROI Año 1: **338%**

---

### Beneficios Intangibles

- 🌟 **Mejora en imagen de marca** (sistema profesional vs Excel)
- 🌟 **Satisfacción del cliente** (experiencia moderna, auto-gestión)
- 🌟 **Escalabilidad del negocio** (franquicias, múltiples sedes)
- 🌟 **Ventaja competitiva** (tecnología que competencia no tiene)
- 🌟 **Reducción de estrés** (automatización, menos errores)
- 🌟 **Toma de decisiones informada** (datos reales, no intuición)

---

## 🎁 PROMOCIÓN DE LANZAMIENTO

### 🌟 Oferta Exclusiva - PRIMER CLIENTE

Como **primer cliente** de PLEXO, ofrecemos condiciones especiales sin precedentes:

#### 💎 Plan de Licencia Perpetua - Descuento Exclusivo

| Concepto | Precio Regular | Descuento Primer Cliente | Precio Final |
|----------|----------------|-------------------------|--------------|
| **Inversión Inicial** | $880,000 | **60% OFF** | **$352,000** |
| **Soporte Año 1** | $168,000 | Incluido | **$0** |
| **Soporte Año 2** | $168,000 | **50% OFF** | **$84,000** |

**Inversión Total Primer Cliente (2 años):**
- Año 1: **$352,000** (vs $1,048,000 regular = ahorro de $696,000)
- Año 2: **$84,000** (vs $168,000 regular = ahorro de $84,000)
- **AHORRO TOTAL 2 AÑOS: $780,000 MXN (64%)**

✅ **Incluye:**
- Código fuente completo
- Licencia perpetua (sin límite de tiempo)
- Usuarios ilimitados
- Eventos ilimitados
- Actualizaciones gratuitas por 2 años
- Soporte técnico premium por 2 años
- Capacitación completa (6 sesiones)
- Migración de datos asistida
- Módulo de IA incluido
- Personalización inicial

⚠️ **Después del Año 2:**
- Soporte técnico se reestructurará a precio de mercado
- Opción de renovar con condiciones preferenciales
- Sistema sigue funcionando sin soporte (licencia perpetua)

❌ **NO Incluye:**
- Infraestructura (servidor/VPS: ~$3,000-8,000/mes)*
- Costos de WhatsApp Business API (~$0.05-0.15/mensaje)
- Costos de IA (OpenAI ~$20-100/mes o Gemini ~$10-50/mes)
- Comisiones Mercado Pago (3.99% + $4 por transacción)
- Dominio y SSL (~$1,500/año)

*Los costos de infraestructura pueden variar según proveedor y recursos requeridos

---

#### 🚀 Plan SaaS Profesional - Descuento Primer Cliente

| Concepto | Precio Regular | Descuento Primer Cliente | Precio Final |
|----------|----------------|-------------------------|--------------|
| **Año 1 (con setup)** | $225,000 | **10% OFF** | **$202,500** |
| **Renovación Anual** | $180,000 | **10% OFF** | **$162,000** |

**Nota sobre SaaS:** El descuento del 10% (vs 65% en Perpetua) se debe a que en el modelo SaaS **nosotros absorbemos los costos de infraestructura**, que pueden variar significativamente según:
- Tráfico y usuarios concurrentes
- Volumen de almacenamiento
- Cantidad de mensajes WhatsApp
- Uso de créditos de IA
- Ancho de banda y CDN
- Respaldos y redundancia

En la modalidad SaaS, estos costos están **incluidos** y garantizados, sin sorpresas.

✅ **Incluye (todo gestionado por nosotros):**
- Hasta 10 usuarios concurrentes
- 3 salones/espacios
- Eventos ilimitados
- 5,000 mensajes WhatsApp/mes incluidos
- 10,000 créditos IA/mes incluidos
- Almacenamiento 50 GB
- **Infraestructura completa administrada**
- **Hosting, servidores, CDN incluido**
- **SSL y dominio incluido**
- Respaldos diarios automáticos
- Actualizaciones continuas
- Soporte 24/7 (email/chat)

❌ **NO Incluye:**
- Comisiones Mercado Pago (3.99% + $4 por transacción)
- WhatsApp adicional ($0.05/mensaje que exceda límite)
- Créditos IA adicionales ($0.002/solicitud que exceda límite)

---

### 📊 Comparativa de Inversión - Primer Cliente

#### Costo Total a 2 Años

| Modalidad | Año 1 | Año 2 | **Total 2 Años** | Ahorro vs Regular |
|-----------|-------|-------|------------------|-------------------|
| **Licencia Perpetua** | $352,000 | $84,000 | **$436,000** | $780,000 (64%) |
| **SaaS Profesional** | $202,500 | $162,000 | **$364,500** | $99,000 (21%) |
| Regular Perpetua | $1,048,000 | $168,000 | $1,216,000 | - |
| Regular SaaS | $225,000 | $180,000 | $405,000 | - |

**💡 Recomendación:** 
- **Licencia Perpetua** si prefieren control total y tienen capacidad de gestionar infraestructura
- **SaaS** si prefieren despreocuparse de la operación técnica (nosotros nos encargamos de todo)

---

**⏰ Oferta Válida Únicamente para el Primer Cliente**  
**📅 Válida hasta: 31 de Diciembre 2025**  
**🎯 Una vez cerrado este contrato, precios regulares aplicarán para futuros clientes**

---

## 📞 PRÓXIMOS PASOS

### Proceso de Contratación

1. **Demo Personalizada** (1 hora)
   - Presentación del sistema con sus datos
   - Casos de uso específicos
   - Resolución de dudas

2. **Período de Prueba** (2 semanas - Opcional)
   - Acceso a ambiente de pruebas
   - Evaluación con usuarios reales
   - Sin compromiso

3. **Propuesta Formal**
   - Cotización detallada
   - Cronograma específico
   - Contrato de servicios

4. **Firma de Contrato**
   - Inicio de análisis
   - Kickoff meeting

5. **Implementación**
   - 4 meses de desarrollo
   - Go-live
   - Soporte continuo

---

## 📋 RESUMEN COMPARATIVO

| Característica | Excel / Manual | PLEXO |
|----------------|----------------|-------|
| Acceso remoto | ❌ | ✅ Desde cualquier dispositivo |
| Multi-usuario | ❌ | ✅ Ilimitado |
| Respaldos automáticos | ❌ | ✅ Cada hora |
| Control de disponibilidad | 🟡 Manual | ✅ Tiempo real |
| Generación de cotizaciones | 🟡 15-20 min | ✅ 2 min |
| Seguimiento de pagos | 🟡 Manual | ✅ Automático |
| Reportes y analytics | ❌ | ✅ Dashboard en vivo |
| Chatbot IA | ❌ | ✅ 24/7 |
| WhatsApp integrado | ❌ | ✅ |
| Portal del cliente | ❌ | ✅ |
| Costo mensual | $0 | Desde $15,000 |
| Pérdidas por errores | Alto | Cero |
| Tiempo administrativo | Alto | -80% |

---

## 🏆 GARANTÍAS

- ✅ **Garantía de satisfacción**: 30 días para solicitar ajustes sin costo
- ✅ **Uptime garantizado**: 99.5% disponibilidad del sistema
- ✅ **Seguridad de datos**: Respaldos diarios, encriptación end-to-end
- ✅ **Soporte incluido**: Sin cargos ocultos por soporte básico
- ✅ **Actualización continua**: Nuevas funciones sin costo adicional
- ✅ **Migración asistida**: Importación completa de datos existentes

---

## 📧 CONTACTO

**Equipo Comercial PLEXO**

📞 Teléfono: [Tu número]  
📧 Email: ventas@plexo.com  
🌐 Web: www.plexo.com  
📍 Dirección: [Tu dirección]

---

## 📄 ANEXOS

### A. Casos de Éxito (Por Definir)
- Testimoniales de clientes beta
- Métricas de mejora reales
- Videos demostrativos

### B. Documentación Técnica
- Arquitectura del sistema
- Especificaciones de seguridad
- Integraciones disponibles

### C. Términos y Condiciones
- Políticas de uso
- SLA detallado
- Acuerdos de confidencialidad

---

**PLEXO** - _Gestión Inteligente para Eventos Extraordinarios_

---

*Documento confidencial - Propuesta comercial preparada exclusivamente para [Nombre del Cliente]*  
*Fecha de emisión: 31 de Octubre de 2025*  
*Validez de la oferta: 60 días*
"""

output_filename = "PROPUESTA_COMERCIAL_PLEXO.docx"
# Directorio actual
current_directory = os.getcwd()
output_path = os.path.join(current_directory, output_filename)


try:
    # Convertir el contenido de Markdown a DOCX
    pypandoc.convert_text(
        markdown_content,
        'docx',
        format='md',
        outputfile=output_path
    )
    print(f"Archivo '{output_filename}' creado exitosamente en: {output_path}")

except Exception as e:
    print(f"Ocurrió un error durante la conversión: {e}")
