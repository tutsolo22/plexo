# Sistema de Herencia de Templates de Email

## 📋 Resumen

El sistema de herencia de templates permite crear una jerarquía de plantillas de email que se pueden personalizar a diferentes niveles:

- **Global**: Templates base del sistema
- **Tenant**: Templates base por inquilino
- **Business**: Templates base por identidad de negocio
- **Custom**: Templates completamente personalizados
- **Inherited**: Templates que heredan de otros con personalizaciones

## 🏗️ Arquitectura

### Jerarquía de Herencia

```
Template Global (Nivel 0)
    ↓
Template Base Tenant (Nivel 1)
    ↓
Template Base Business (Nivel 2)
    ↓
Template Personalizado (Nivel 3+)
```

### Base de Datos

#### Enum EmailTemplateType
```sql
GLOBAL      -- Template global/base del sistema
TENANT_BASE -- Template base del tenant
BUSINESS_BASE -- Template base del business identity
CUSTOM      -- Template personalizado
INHERITED   -- Template heredado con personalizaciones
```

#### Campos Principales
- `parentTemplateId`: ID del template padre
- `templateType`: Tipo de template según jerarquía
- `isGlobal`: Marca si es un template global
- `inheritanceLevel`: Nivel en la jerarquía (0=global)
- `customizations`: JSON con personalizaciones aplicadas
- `metadata`: Configuraciones adicionales

## 🚀 Funcionalidades Principales

### 1. Búsqueda Inteligente de Templates

La función `findBestTemplate()` busca el template más específico disponible:

```typescript
const template = await findBestTemplate({
  tenantId: 'tenant-123',
  businessIdentityId: 'business-456',
  category: EmailCategory.REGISTRATION
})
```

**Orden de búsqueda:**
1. Template específico del Business Identity
2. Template base del Business Identity  
3. Template base del Tenant
4. Template global del sistema

### 2. Resolución de Herencia

La función `resolveTemplate()` aplica las personalizaciones de la cadena de herencia:

```typescript
const resolvedTemplate = await resolveTemplate(template)
```

### 3. Creación de Templates Heredados

```typescript
const customTemplate = await createInheritedTemplate(
  parentTemplateId,
  {
    subject: 'Asunto personalizado',
    htmlContent: 'Contenido personalizado',
    metadata: { customColors: { primary: '#ff0000' } }
  },
  {
    name: 'Mi Template Personalizado',
    tenantId: 'tenant-123',
    businessIdentityId: 'business-456'
  }
)
```

### 4. Actualización de Personalizaciones

```typescript
await updateTemplateCustomizations(templateId, {
  metadata: {
    branding: {
      primaryColor: '#2563eb',
      logoUrl: 'https://example.com/logo.png'
    }
  }
})
```

## 📊 Templates Globales Incluidos

### 1. Template Global - Bienvenida
- **Categoría**: REGISTRATION
- **Variables**: businessName, clientName, activationLink
- **Características**: Diseño moderno con gradientes, responsive

### 2. Template Global - Recuperación de Contraseña  
- **Categoría**: PASSWORD_RESET
- **Variables**: businessName, clientName, resetLink
- **Características**: Énfasis en seguridad, advertencias de expiración

### 3. Template Global - Envío de Cotización
- **Categoría**: QUOTE_SEND  
- **Variables**: businessName, clientName, eventTitle, eventDate, eventLocation, quoteTotal, quoteLink, validUntil
- **Características**: Diseño profesional, detalles del evento destacados

## 🔧 Uso en Aplicaciones

### En API Routes (Next.js)

```typescript
// api/send-email/route.ts
import { findBestTemplate, resolveTemplate } from '@/lib/template-inheritance'

export async function POST(request: Request) {
  const { tenantId, businessIdentityId, category, recipientEmail } = await request.json()
  
  const template = await findBestTemplate({
    tenantId,
    businessIdentityId, 
    category
  })
  
  const resolvedTemplate = await resolveTemplate(template)
  
  // Usar resolvedTemplate para enviar email
}
```

### En Componentes React

```typescript
// components/EmailTemplateEditor.tsx
import { createInheritedTemplate } from '@/lib/template-inheritance'

export default function EmailTemplateEditor({ parentTemplateId }) {
  const handleSave = async (customizations) => {
    await createInheritedTemplate(
      parentTemplateId,
      customizations,
      {
        name: 'Mi Template',
        tenantId: currentTenant.id,
        businessIdentityId: currentBusiness.id
      }
    )
  }
}
```

## 🛠️ Configuración Inicial

### 1. Ejecutar Migración
```bash
npx prisma migrate dev --name template_inheritance_system
```

### 2. Inicializar Templates Globales
Se ejecutó automáticamente con el seed, pero también disponible:
```bash
node scripts/init-template-system.js
```

### 3. Crear Templates Base para Tenant
```typescript
import { createBaseTenantTemplates } from '@/lib/template-inheritance'

await createBaseTenantTemplates(tenantId)
```

## 📈 Ventajas del Sistema

1. **Consistencia**: Templates base aseguran diseño coherente
2. **Flexibilidad**: Personalización a múltiples niveles
3. **Mantenimiento**: Cambios en templates base se propagan automáticamente
4. **Escalabilidad**: Fácil agregar nuevos niveles de herencia
5. **Performance**: Búsqueda optimizada con índices de base de datos

## 🔍 Casos de Uso

### Caso 1: Empresa con Múltiples Marcas
- Template global base
- Templates específicos por marca (business identity)
- Personalización por tipo de evento

### Caso 2: SaaS Multi-Tenant
- Templates globales del sistema
- Cada tenant personaliza con su branding
- Business identities dentro del tenant con variaciones

### Caso 3: Franquicia
- Templates corporativos (global/tenant)
- Cada franquicia (business) personaliza detalles locales
- Mantiene consistencia de marca global

## 🚨 Consideraciones Importantes

1. **Performance**: Evitar cadenas de herencia muy profundas
2. **Seguridad**: Validar contenido HTML en personalizaciones
3. **Versionado**: Considerar versionado para templates críticos
4. **Backup**: Los templates son datos críticos del negocio
5. **Testing**: Probar templates en diferentes clientes de email

## 📋 TODO Futuro

- [ ] Sistema de versionado de templates
- [ ] Preview en tiempo real de personalizaciones
- [ ] Importación/exportación de templates
- [ ] Analytics de performance de templates
- [ ] Sistema de aprobación para cambios
- [ ] Templates multi-idioma
- [ ] Editor visual de templates