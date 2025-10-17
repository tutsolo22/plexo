# 📋 FASE 2D: Sistema de Cotizaciones Avanzado + Gestor de Plantillas

## 🎯 **Objetivos de la Fase 2D**

Implementar un **Sistema de Cotizaciones Avanzado** integrado con un **Gestor de Plantillas Visual**, permitiendo:

1. **💼 Cotizaciones Profesionales** - Generación automática con plantillas personalizables
2. **📝 Gestor de Plantillas** - Editor visual para crear y gestionar plantillas
3. **📄 Generación PDF** - PDFs profesionales con diseños personalizados
4. **📧 Envío Automático** - Sistema de email con seguimiento
5. **🔗 Integración Total** - Conexión fluida con eventos y clientes

---

## 🗂️ **Arquitectura del Sistema**

### **1. Modelo de Datos - Templates**

```prisma
model Template {
  id          String   @id @default(cuid())
  name        String   // "Cotización Eventos Sociales"
  description String?  // Descripción del template
  type        TemplateType // QUOTE, CONTRACT, INVOICE, EMAIL
  category    String?  // "eventos", "bodas", "corporativo"
  
  // Contenido del template
  content     Json     // HTML/Texto con variables {{variable}}
  variables   Json     // ["clientName", "eventDate", "totalAmount"]
  styles      Json?    // CSS styles para PDF
  
  // Metadata
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  version     Int      @default(1)
  
  // Relaciones
  createdBy   String
  creator     User     @relation(fields: [createdBy], references: [id])
  quotes      Quote[]  // Cotizaciones usando este template
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum TemplateType {
  QUOTE       // Cotizaciones
  CONTRACT    // Contratos
  INVOICE     // Facturas
  EMAIL       // Templates de email
  PROPOSAL    // Propuestas comerciales
}
```

### **2. Modelo de Datos - Quotes Extendido**

```prisma
model Quote {
  id              String      @id @default(cuid())
  
  // Información básica (ya existente)
  clientId        String
  client          Client      @relation(fields: [clientId], references: [id])
  
  // NUEVO: Template y generación
  templateId      String?
  template        Template?   @relation(fields: [templateId], references: [id])
  
  // NUEVO: Contenido generado
  generatedContent Json?      // HTML final con variables reemplazadas
  pdfUrl          String?     // URL del PDF generado
  
  // NUEVO: Versioning y estados
  version         Int         @default(1)
  previousVersion String?     // ID de versión anterior
  
  // NUEVO: Envío y seguimiento
  sentAt          DateTime?   // Cuándo se envió
  viewedAt        DateTime?   // Cuándo fue vista por el cliente
  respondedAt     DateTime?   // Cuándo respondió el cliente
  
  // Campos existentes...
  status          QuoteStatus @default(DRAFT)
  validUntil      DateTime
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum QuoteStatus {
  DRAFT           // Borrador
  SENT            // Enviada
  VIEWED          // Vista por cliente
  ACCEPTED        // Aceptada
  REJECTED        // Rechazada
  EXPIRED         // Expirada
  REVISED         // Revisada
}
```

---

## 🔧 **APIs a Implementar**

### **1. APIs de Cotizaciones (/api/quotes)**

#### **CRUD Principal**
```typescript
GET    /api/quotes               // Lista con filtros avanzados
POST   /api/quotes               // Crear cotización
GET    /api/quotes/[id]          // Detalle completo
PUT    /api/quotes/[id]          // Actualizar
DELETE /api/quotes/[id]          // Eliminar
```

#### **Funcionalidades Avanzadas**
```typescript
POST   /api/quotes/[id]/generate    // Generar contenido con template
GET    /api/quotes/[id]/pdf         // Generar/descargar PDF
POST   /api/quotes/[id]/send        // Enviar por email
POST   /api/quotes/[id]/duplicate   // Duplicar cotización
GET    /api/quotes/[id]/versions    // Historial de versiones
POST   /api/quotes/[id]/accept      // Aceptar cotización (cliente)
```

### **2. APIs de Plantillas (/api/templates)**

#### **CRUD Principal**
```typescript
GET    /api/templates            // Lista por categoría/tipo
POST   /api/templates            // Crear template
GET    /api/templates/[id]       // Detalle completo
PUT    /api/templates/[id]       // Actualizar
DELETE /api/templates/[id]       // Eliminar
```

#### **Funcionalidades Especiales**
```typescript
POST   /api/templates/[id]/preview     // Vista previa con datos
POST   /api/templates/[id]/duplicate   // Duplicar template
GET    /api/templates/variables        // Variables disponibles
POST   /api/templates/[id]/test        // Probar template
GET    /api/templates/categories       // Categorías disponibles
```

---

## 🎨 **Componentes a Desarrollar**

### **1. TemplateEditor.tsx - Editor Visual**

```typescript
interface TemplateEditorProps {
  template?: Template;
  onSave: (data: TemplateFormData) => void;
  onCancel: () => void;
}

// Funcionalidades:
// ✅ Editor WYSIWYG (TinyMCE o similar)
// ✅ Panel de variables arrastrables
// ✅ Vista previa en tiempo real
// ✅ Selector de estilos CSS
// ✅ Validación de sintaxis
// ✅ Gestión de categorías
```

### **2. QuoteGenerator.tsx - Generador Inteligente**

```typescript
interface QuoteGeneratorProps {
  eventId?: string;
  clientId?: string;
  templateId?: string;
  onGenerated: (quote: Quote) => void;
}

// Funcionalidades:
// ✅ Selección de template
// ✅ Auto-población desde evento
// ✅ Editor de contenido
// ✅ Calculadora de precios
// ✅ Vista previa PDF
// ✅ Envío directo
```

### **3. PDFGenerator.tsx - Generación PDF**

```typescript
interface PDFGeneratorProps {
  quote: Quote;
  template: Template;
  onGenerated: (pdfUrl: string) => void;
}

// Tecnologías opciones:
// - react-pdf (cliente)
// - puppeteer (servidor)
// - jsPDF (ligero)
// - PDF-lib (avanzado)
```

### **4. EmailComposer.tsx - Compositor Email**

```typescript
interface EmailComposerProps {
  quote: Quote;
  client: Client;
  onSent: (sentData: EmailSentData) => void;
}

// Funcionalidades:
// ✅ Template de email HTML
// ✅ Adjuntar PDF automático
// ✅ Personalización de mensaje
// ✅ Programar envío
// ✅ Seguimiento de apertura
```

---

## 📱 **Páginas a Crear**

### **1. Sistema de Cotizaciones**

#### `/dashboard/quotes` - Vista Principal
- **Lista de cotizaciones** con filtros avanzados
- **Estados visuales** con badges coloridos
- **Acciones rápidas**: Ver, Editar, Duplicar, Enviar
- **Búsqueda** por cliente, fecha, estado
- **Métricas** de conversión y envíos

#### `/dashboard/quotes/new` - Crear Cotización
- **Selector de template** con vista previa
- **Formulario inteligente** con auto-población
- **Editor de contenido** integrado
- **Calculadora de precios** dinámica
- **Vista previa PDF** en tiempo real

#### `/dashboard/quotes/[id]` - Detalle Cotización
- **Vista completa** con toda la información
- **Historial de versiones** y cambios
- **Timeline de seguimiento** (enviado, visto, respondido)
- **Acciones**: Editar, Enviar, Generar PDF, Duplicar
- **Panel de cliente** con información relevante

#### `/dashboard/quotes/[id]/edit` - Editar Cotización
- **Editor completo** con template
- **Control de versiones** automático
- **Comparación** con versión anterior
- **Vista previa** en tiempo real

### **2. Gestor de Plantillas**

#### `/dashboard/templates` - Gestión de Plantillas
- **Grid de plantillas** por categorías
- **Vista previa** rápida
- **Filtros** por tipo, categoría, estado
- **Acciones**: Crear, Editar, Duplicar, Eliminar
- **Estadísticas** de uso

#### `/dashboard/templates/new` - Crear Plantilla
- **Editor visual** completo
- **Selector de tipo** y categoría
- **Panel de variables** disponibles
- **Vista previa** con datos de prueba

#### `/dashboard/templates/[id]/edit` - Editor Visual
- **Editor WYSIWYG** avanzado
- **Panel de variables** arrastrables
- **Vista previa** en tiempo real
- **Gestor de estilos** CSS
- **Versionado** automático

---

## 🔗 **Integraciones del Sistema**

### **1. Conexión con Eventos**
```typescript
// Flujo: Evento → Cotización
// 1. Desde detalle de evento: "Generar Cotización"
// 2. Auto-popular datos del evento
// 3. Seleccionar template apropiado
// 4. Generar cotización vinculada
```

### **2. Conexión con Clientes**
```typescript
// Flujo: Cliente → Historial Cotizaciones
// 1. Ver todas las cotizaciones del cliente
// 2. Estado de cada cotización
// 3. Métricas de conversión
// 4. Plantillas más usadas
```

### **3. Conexión con Dashboard**
```typescript
// Métricas para Dashboard:
// - Cotizaciones enviadas este mes
// - Tasa de conversión
// - Templates más utilizados
// - Ingresos proyectados
```

---

## 📊 **Variables del Sistema**

### **Variables Globales Disponibles**
```typescript
const GLOBAL_VARIABLES = {
  // Cliente
  clientName: "{{clientName}}",
  clientEmail: "{{clientEmail}}",
  clientPhone: "{{clientPhone}}",
  clientAddress: "{{clientAddress}}",
  
  // Evento
  eventTitle: "{{eventTitle}}",
  eventDate: "{{eventDate}}",
  eventTime: "{{eventTime}}",
  eventDuration: "{{eventDuration}}",
  
  // Cotización
  quoteNumber: "{{quoteNumber}}",
  quoteDate: "{{quoteDate}}",
  validUntil: "{{validUntil}}",
  totalAmount: "{{totalAmount}}",
  
  // Empresa
  companyName: "{{companyName}}",
  companyAddress: "{{companyAddress}}",
  companyPhone: "{{companyPhone}}",
  companyEmail: "{{companyEmail}}",
  
  // Dinámicas
  currentDate: "{{currentDate}}",
  currentUser: "{{currentUser}}",
};
```

---

## 🚀 **Plan de Implementación**

### **Fase 1: Estructura Base** (Días 1-2)
1. ✅ Crear modelos Prisma
2. ✅ Implementar APIs básicas
3. ✅ Configurar dependencias

### **Fase 2: Templates** (Días 3-4)
1. ✅ Sistema de plantillas
2. ✅ Editor visual básico
3. ✅ Variables dinámicas

### **Fase 3: Cotizaciones** (Días 5-6)
1. ✅ Generador de cotizaciones
2. ✅ Integración con templates
3. ✅ Interface de gestión

### **Fase 4: PDF y Email** (Días 7-8)
1. ✅ Generación de PDF
2. ✅ Sistema de envío
3. ✅ Seguimiento

### **Fase 5: Integración** (Días 9-10)
1. ✅ Conexión con eventos
2. ✅ Dashboard metrics
3. ✅ Testing completo

---

## 📦 **Dependencias Nuevas**

```json
{
  // Editor visual
  "@tinymce/tinymce-react": "^4.x",
  
  // Generación PDF
  "react-pdf": "^7.x",
  "@react-pdf/renderer": "^3.x",
  
  // Email
  "nodemailer": "^6.x",
  "@types/nodemailer": "^6.x",
  
  // Plantillas
  "handlebars": "^4.x",
  "mustache": "^4.x",
  
  // Utilidades
  "html2canvas": "^1.x",
  "jspdf": "^2.x"
}
```

---

## 🎯 **Resultados Esperados**

Al completar la **Fase 2D**, el sistema tendrá:

✅ **Gestor de Plantillas Visual** completo  
✅ **Sistema de Cotizaciones Avanzado** con PDF  
✅ **Integración total** con eventos y clientes  
✅ **Envío automático** con seguimiento  
✅ **Editor WYSIWYG** para plantillas  
✅ **Variables dinámicas** configurables  
✅ **Versionado** y control de cambios  
✅ **Métricas** de conversión integradas  

**¿Proceder con la implementación de la Fase 2D?** 🚀