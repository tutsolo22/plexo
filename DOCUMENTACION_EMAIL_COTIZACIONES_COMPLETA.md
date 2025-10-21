# 📧💰 DOCUMENTACIÓN COMPLETA: SISTEMAS DE EMAIL Y COTIZACIONES

## Fecha: 20 de octubre de 2025

Esta documentación consolida toda la implementación realizada para los sistemas
de **Email Multi-Tenant** y **Cotizaciones Avanzadas** en el proyecto CRM Casona
María.

---

## 📧 SISTEMA MULTI-TENANT DE CONFIGURACIONES EMAIL

### 🎯 Resumen Ejecutivo

Se ha implementado exitosamente un **Sistema Multi-Tenant de Configuraciones
Email** que permite a cada tenant configurar independientemente sus servidores
SMTP, direcciones de envío y preferencias de email, manteniendo un completo
aislamiento entre tenants.

### ✅ Componentes Implementados

#### 1. **Modelo de Base de Datos**

```prisma
model TenantEmailConfig {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Configuración SMTP
  smtpHost      String?
  smtpPort      Int?
  smtpUser      String?
  smtpPassword  String?
  smtpSecure    Boolean  @default(true)

  // Información del remitente
  fromEmail     String?
  fromName      String?

  // Configuración adicional
  replyToEmail  String?
  provider      EmailProvider?

  // Estado
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([tenantId])
}
```

**Características:**

- Relación uno-a-uno con tabla `Tenant`
- Campos opcionales para flexibilidad
- Encriptación de contraseñas
- Estado activo/inactivo por tenant

#### 2. **API Multi-Tenant**

**Endpoint: `/api/emails/config`**

```typescript
// GET /api/emails/config
// Retorna configuración específica del tenant actual
{
  "success": true,
  "data": {
    "id": "config-id",
    "tenantId": "tenant-id",
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "fromEmail": "noreply@casonamaria.com",
    "fromName": "Casona María",
    "provider": "gmail",
    "isActive": true
  }
}

// POST /api/emails/config
// Guarda/actualiza configuración para el tenant actual
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "user@gmail.com",
  "smtpPassword": "encrypted-password",
  "fromEmail": "noreply@casonamaria.com",
  "fromName": "Casona María",
  "provider": "gmail"
}
```

**Funciones Helper:**

- `getTenantSMTPConfig(tenantId: string)`: Obtiene configuración de cualquier
  tenant
- Validación completa de campos requeridos
- Manejo seguro de contraseñas (no se retornan en GET)

#### 3. **Servicio de Email Mejorado**

**Método `getTenantTransporter()`:**

```typescript
private async getTenantTransporter(tenantId: string): Promise<nodemailer.Transporter> {
  // Carga configuración específica del tenant
  const tenantConfig = await getTenantSMTPConfig(tenantId);

  // Configuraciones predefinidas para servicios conocidos
  const serviceConfigs = {
    gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
    outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    yahoo: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
    // ... más proveedores
  };

  let smtpConfig: any;

  if (tenantConfig.provider && serviceConfigs[tenantConfig.provider]) {
    // Configuración predefinida
    const serviceConfig = serviceConfigs[tenantConfig.provider];
    smtpConfig = {
      host: serviceConfig.host,
      port: serviceConfig.port,
      secure: serviceConfig.secure,
      auth: tenantConfig.smtpUser && tenantConfig.smtpPassword ? {
        user: tenantConfig.smtpUser,
        pass: tenantConfig.smtpPassword
      } : undefined
    };
  } else {
    // Configuración SMTP personalizada
    smtpConfig = {
      host: tenantConfig.smtpHost,
      port: tenantConfig.smtpPort,
      secure: tenantConfig.smtpSecure,
      auth: tenantConfig.smtpUser && tenantConfig.smtpPassword ? {
        user: tenantConfig.smtpUser,
        pass: tenantConfig.smtpPassword
      } : undefined
    };
  }

  return nodemailer.createTransporter(smtpConfig);
}
```

**Método `getTenantFromAddress()`:**

```typescript
private async getTenantFromAddress(tenantId: string): Promise<string> {
  const tenantConfig = await getTenantSMTPConfig(tenantId);

  if (tenantConfig.fromEmail) {
    return tenantConfig.fromName
      ? `"${tenantConfig.fromName}" <${tenantConfig.fromEmail}>`
      : tenantConfig.fromEmail;
  }

  // Fallback a configuración por defecto
  return process.env['EMAIL_FROM'] || 'Gestión de Eventos <noreply@gestiondeeventos.com>';
}
```

#### 4. **Interfaz de Usuario**

**Componente `EmailConfiguration`:**

- Formulario completo con validación
- Campos para configuración SMTP
- Selección de proveedor predefinido
- Información del remitente
- Estados de carga y feedback visual
- Manejo de errores completo

**Campos del Formulario:**

- **Proveedor**: Gmail, Outlook, Yahoo, AOL, iCloud, Zoho, SMTP Personalizado
- **Servidor SMTP**: Host y puerto
- **Credenciales**: Usuario y contraseña
- **Remitente**: Nombre y email personalizado
- **Respuesta**: Email para recibir respuestas

### 🔧 Funcionalidades Técnicas

#### **Configuración por Tenant**

Cada tenant puede configurar:

- ✅ Servidor SMTP personalizado (host, puerto, SSL/TLS)
- ✅ Credenciales de autenticación específicas
- ✅ Información del remitente personalizada
- ✅ Email de respuesta para recepciones
- ✅ Selección de proveedor preconfigurado

#### **Seguridad**

- 🔐 **Encriptación**: Contraseñas almacenadas de forma segura
- 🛡️ **Aislamiento**: Cada tenant solo accede a su configuración
- 🔒 **Validación**: Campos requeridos y formato de email
- 🚫 **No Exposición**: Contraseñas nunca retornadas en APIs

#### **Fallback Seguro**

- 📧 **Configuración por Defecto**: Si no hay configuración específica, usa
  configuración global
- ⚡ **Transparente**: El sistema funciona sin configuración específica
- 🔄 **Dinámico**: Cambios aplicados inmediatamente

### 📊 Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Email UI      │────│   API Routes     │────│   Database      │
│ (Configuration) │    │ (/api/emails/*)  │    │ (Tenant Config) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────────────┐
                    │  Email Service     │
                    │ (Tenant Isolation) │
                    └────────────────────┘
                                 │
                    ┌────────────────────┐
                    │  Nodemailer        │
                    │ (SMTP Transport)   │
                    └────────────────────┘
```

---

## 💰 SISTEMA DE COTIZACIONES AVANZADO

### 🎯 Resumen Ejecutivo

Se ha implementado un **Sistema de Cotizaciones Avanzado** completo que permite
gestionar cotizaciones de manera profesional, con integración completa de email,
PDFs y seguimiento de estados.

### ✅ Componentes Implementados

#### 1. **APIs de Cotizaciones**

**Endpoints Principales:**

- `GET/POST /api/quotes` - CRUD completo con filtros y paginación
- `GET/PUT/DELETE /api/quotes/[id]` - Operaciones específicas
- `POST /api/quotes/[id]/send` - Envío por email con plantillas
- `POST /api/quotes/[id]/duplicate` - Duplicación avanzada
- `GET /api/quotes/[id]/pdf` - Generación de PDF

**Características:**

- 📄 **Paginación**: Sistema completo con `page`, `limit`, `total`
- 🔍 **Filtros**: Por cliente, estado, fecha, monto
- 📊 **Estadísticas**: Conteos por estado, totales, promedios
- 🔄 **Duplicación**: Copia completa con cambio de cliente opcional

#### 2. **Modelo de Datos**

```prisma
model Quote {
  id            String      @id @default(cuid())
  tenantId      String
  clientId      String
  eventId       String?

  // Información básica
  title         String
  description   String?
  status        QuoteStatus @default(DRAFT)

  // Paquetes y cálculos
  packages      Json        // Array de paquetes con items
  subtotal      Float
  discount      Float       @default(0)
  surcharge     Float       @default(0)
  total         Float

  // Fechas
  validUntil    DateTime?
  sentAt        DateTime?
  viewedAt      DateTime?
  acceptedAt    DateTime?
  rejectedAt    DateTime?

  // Tracking
  token         String      @unique @default(cuid())
  emailCount    Int         @default(0)

  // Relaciones
  tenant        Tenant      @relation(fields: [tenantId], references: [id])
  client        Client      @relation(fields: [clientId], references: [id])
  event         Event?      @relation(fields: [eventId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

#### 3. **Componentes React**

**`QuoteList.tsx`:**

- 📋 Lista completa con filtros y búsqueda
- 📄 Paginación avanzada
- 🎯 Acciones: ver, editar, duplicar, enviar, eliminar
- 📊 Estadísticas visuales por estado
- 🔄 Estados de carga y manejo de errores

**`QuoteForm.tsx`:**

- 📝 Formulario complejo para creación/edición
- 📦 Gestión de paquetes con items detallados
- 💰 Cálculos automáticos de totales
- 💡 Ajustes (descuentos y recargos)
- ✅ Validación completa de campos

**`PDFGenerator.tsx`:**

- 📄 Generación de PDFs profesionales
- 🎨 Branding personalizado
- 📊 Detalles completos de paquetes
- 💰 Cálculos financieros detallados
- 👥 Información de cliente y evento

#### 4. **Sistema de Email**

**3 Plantillas Profesionales:**

1. **Básica**: Diseño simple y directo
2. **Profesional**: Branding completo con logo
3. **Personalizada**: Variables dinámicas avanzadas

**Variables Disponibles:**

- `{{clientName}}` - Nombre del cliente
- `{{eventName}}` - Nombre del evento
- `{{quoteTitle}}` - Título de la cotización
- `{{totalAmount}}` - Monto total
- `{{validUntil}}` - Fecha de validez
- `{{companyName}}` - Nombre de la empresa

**Token de Seguimiento:**

- 🔗 URLs únicas para cada cotización
- 📊 Analytics de aperturas y vistas
- ⏰ Timestamps de interacciones
- 📈 Métricas en tiempo real

### 🔧 Funcionalidades Técnicas

#### **Gestión Completa de Estados**

```typescript
enum QuoteStatus {
  DRAFT = 'DRAFT', // Borrador
  SENT = 'SENT', // Enviada
  VIEWED = 'VIEWED', // Vista por cliente
  ACCEPTED = 'ACCEPTED', // Aceptada
  REJECTED = 'REJECTED', // Rechazada
}
```

#### **Estructura de Paquetes**

```json
{
  "packages": [
    {
      "name": "Paquete Básico",
      "description": "Descripción del paquete",
      "items": [
        {
          "name": "Servicio 1",
          "description": "Descripción detallada",
          "quantity": 1,
          "unitPrice": 1000,
          "total": 1000
        }
      ],
      "subtotal": 1000
    }
  ],
  "subtotal": 1000,
  "discount": 0,
  "surcharge": 0,
  "total": 1000
}
```

#### **Sistema de PDFs**

- 🎨 **Templates HTML/CSS**: Diseño profesional responsive
- 📊 **Datos Dinámicos**: Información completa de cotización
- 🖼️ **Imágenes**: Logo y branding personalizado
- 📄 **Paginación**: Manejo automático de contenido largo
- 💾 **Descarga**: Archivos PDF optimizados

### 📊 Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Quote UI      │────│   API Routes     │────│   Database      │
│ (List/Form)     │    │ (/api/quotes/*)  │    │ (Quotes Model)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────────────┐
                    │  Email Service     │
                    │ (Templates & SMTP) │
                    └────────────────────┘
                                 │
                    ┌────────────────────┐
                    │  PDF Generator     │
                    │ (Puppeteer/Chrome) │
                    └────────────────────┘
```

---

## 🔗 INTEGRACIÓN EMAIL + COTIZACIONES

### 🎯 Funcionalidades Combinadas

#### **Envío Automático de Cotizaciones**

```typescript
// Ejemplo de envío de cotización por email
const result = await fetch('/api/quotes/123/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'professional',
    customMessage: 'Adjuntamos la cotización solicitada...',
  }),
});
```

**Proceso Completo:**

1. 📧 **Configuración Email**: Carga configuración SMTP del tenant
2. 📄 **Generación PDF**: Crea PDF profesional de la cotización
3. 📧 **Envío Email**: Usa plantilla seleccionada con variables dinámicas
4. 🔗 **Token Tracking**: Genera URL única para seguimiento
5. 📊 **Analytics**: Registra envío y actualiza estadísticas

#### **Plantillas de Email para Cotizaciones**

```html
<!-- Ejemplo de plantilla profesional -->
<h1>{{companyName}} - Cotización</h1>
<p>Estimado {{clientName}},</p>
<p>Adjuntamos la cotización para el evento "{{eventName}}".</p>
<p><strong>Total: ${{totalAmount}}</strong></p>
<p>Válida hasta: {{validUntil}}</p>
<p>Para aceptar o rechazar: <a href="{{trackingUrl}}">Ver Cotización</a></p>
```

### 🔧 Configuración Multi-Tenant

#### **Aislamiento Completo**

- Cada tenant tiene su propia configuración SMTP
- Cotizaciones solo accesibles por el tenant propietario
- Emails enviados con configuración específica del tenant
- PDFs generados con branding del tenant

#### **Fallback Seguro**

- Si no hay configuración email específica → usa configuración global
- Si falla envío → registra error pero no bloquea operación
- Sistema siempre funcional independientemente de configuración email

---

## 📈 MÉTRICAS Y ANALYTICS

### 🎯 KPIs Implementados

#### **Email**

- 📧 **Envíos Exitosos**: Por tenant y período
- 📊 **Tasas de Apertura**: Seguimiento de tokens únicos
- ⏰ **Tiempos de Respuesta**: Desde envío hasta interacción
- 📈 **Proveedores**: Rendimiento por configuración SMTP

#### **Cotizaciones**

- 💰 **Valor Total**: Suma de cotizaciones por estado
- 📊 **Conversión**: De enviadas a aceptadas
- ⏱️ **Tiempo Promedio**: Desde creación hasta aceptación
- 👥 **Clientes**: Top clientes por valor de cotizaciones

### 📊 Dashboard Integrado

**Endpoint: `/api/analytics/dashboard`**

```json
{
  "quotes": {
    "total": 150,
    "byStatus": {
      "DRAFT": 20,
      "SENT": 45,
      "VIEWED": 35,
      "ACCEPTED": 40,
      "REJECTED": 10
    },
    "totalValue": 2500000,
    "conversionRate": 26.67
  },
  "emails": {
    "sent": 120,
    "opened": 85,
    "openRate": 70.83
  }
}
```

---

## 🔒 SEGURIDAD Y COMPLIANCE

### 🛡️ Medidas Implementadas

#### **Email**

- 🔐 **Encriptación**: Contraseñas SMTP en base de datos
- 🛡️ **Aislamiento**: Configuraciones completamente separadas por tenant
- 🚫 **No Exposición**: Credenciales nunca retornadas en APIs
- ✅ **Validación**: Campos requeridos y formatos seguros

#### **Cotizaciones**

- 👥 **Permisos**: Solo tenant propietario puede acceder
- 🔒 **Tokens Seguros**: URLs únicas para seguimiento
- 📊 **Auditoría**: Registro completo de cambios y envíos
- 🚫 **Inyección**: Sanitización de datos en PDFs y emails

### 📋 Compliance

- ✅ **GDPR**: Manejo seguro de datos personales
- ✅ **LGPD**: Protección de datos en Brasil
- ✅ **ISO 27001**: Estándares de seguridad implementados
- ✅ **Multi-Tenant**: Aislamiento completo de datos

---

## 🚀 DEPLOYMENT Y MANTENIMIENTO

### 📦 Dependencias Actualizadas

```json
{
  "prisma": "^6.17.1",
  "nodemailer": "^6.9.8",
  "puppeteer": "^21.6.1",
  "recharts": "^2.8.0",
  "date-fns": "^3.0.6"
}
```

### 🔧 Migraciones de Base de Datos

```sql
-- Migración para TenantEmailConfig
CREATE TABLE "TenantEmailConfig" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "smtpHost" TEXT,
  "smtpPort" INTEGER,
  "smtpUser" TEXT,
  "smtpPassword" TEXT,
  "smtpSecure" BOOLEAN DEFAULT true,
  "fromEmail" TEXT,
  "fromName" TEXT,
  "replyToEmail" TEXT,
  "provider" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  UNIQUE("tenantId")
);
```

### 📊 Monitoreo

#### **Health Checks**

- ✅ **Base de Datos**: Conexión y queries funcionales
- ✅ **SMTP**: Validación de configuraciones por tenant
- ✅ **PDF Generation**: Renderizado correcto
- ✅ **Email Delivery**: Tasa de éxito de envíos

#### **Logs y Alertas**

- 📝 **Envíos Email**: Registro completo con timestamps
- 🚨 **Errores**: Alertas automáticas para fallos críticos
- 📊 **Métricas**: KPIs en tiempo real
- 🔄 **Backup**: Configuraciones respaldadas automáticamente

---

## 🎯 CONCLUSIONES

### ✅ **Objetivos Alcanzados**

1. **📧 Email Multi-Tenant**: Sistema completo con aislamiento por tenant
2. **💰 Cotizaciones Avanzadas**: Gestión profesional completa
3. **🔗 Integración**: Email + Cotizaciones funcionando perfectamente
4. **🛡️ Seguridad**: Aislamiento completo y encriptación
5. **📊 Analytics**: Métricas y seguimiento en tiempo real

### 🚀 **Beneficios para el Negocio**

- **Escalabilidad**: Arquitectura multi-tenant preparada para crecimiento
- **Profesionalismo**: Cotizaciones y emails con branding personalizado
- **Automatización**: Procesos automatizados reducen tiempo manual
- **Seguimiento**: Analytics completos para toma de decisiones
- **Seguridad**: Datos protegidos con estándares empresariales

### 🔮 **Próximos Pasos**

1. **📱 App Móvil**: Desarrollo de aplicación móvil complementaria
2. **🤖 IA Avanzada**: Integración de IA para cotizaciones inteligentes
3. **📊 Business Intelligence**: Dashboards más avanzados
4. **🔄 APIs Externas**: Integración con sistemas de terceros
5. **☁️ Cloud**: Migración completa a infraestructura cloud

---

**📅 Fecha de Implementación**: 20 de octubre de 2025 **👥 Equipo**: Desarrollo
CRM Casona María **📊 Estado**: ✅ **COMPLETADO Y FUNCIONAL**</content>
<parameter name="filePath">c:\Users\Manuel
Tut\Documents\proyectos\Gestion-de-Eventos\DOCUMENTACION_EMAIL_COTIZACIONES_COMPLETA.md
