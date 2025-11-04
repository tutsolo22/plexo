# Guía de Auditoría - Sistema de Configuración de Proveedores IA

## Descripción General

El sistema de auditoría registra **todas las modificaciones** realizadas en las configuraciones de proveedores de IA (OpenAI, Google, Anthropic, Cohere). Esto proporciona trazabilidad completa para:

- **Cumplimiento normativo**: Quién modificó qué, cuándo y desde dónde
- **Análisis de seguridad**: Detectar cambios no autorizados
- **Debugging**: Entender el historial de cambios de configuración
- **Acceso de auditoría**: Revisar todas las operaciones sensibles

---

## Datos Registrados

Cada entrada de auditoría captura:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | CUID | Identificador único |
| `action` | STRING | Tipo de operación: CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE |
| `provider` | STRING | Nombre del proveedor (openai, google, anthropic, cohere) |
| `userId` | STRING | ID del usuario que realizó la acción |
| `tenantId` | STRING | ID del tenant (aislamiento multi-tenant) |
| `aiProviderConfigId` | STRING | ID de la configuración (si aún existe) |
| `changesDetails` | JSON | Valores anteriores y nuevos `{ oldValues: {...}, newValues: {...} }` |
| `description` | STRING | Descripción legible en español |
| `ipAddress` | STRING | IP del cliente que realizó la solicitud |
| `createdAt` | DATETIME | Timestamp de la acción |

### Ejemplo de Entrada:

```json
{
  "id": "clz7k8m9n0p1q2r3s4t5u6v7w",
  "action": "UPDATE",
  "provider": "openai",
  "userId": "user_123",
  "tenantId": "tenant_456",
  "aiProviderConfigId": "config_789",
  "changesDetails": {
    "oldValues": { "isActive": false },
    "newValues": { "isActive": true }
  },
  "description": "Actualizada configuración de openai",
  "ipAddress": "192.168.1.100",
  "createdAt": "2024-12-15T14:23:45.000Z"
}
```

---

## Tipos de Acciones Registradas

### 1. CREATE - Crear Nueva Configuración
- **Cuándo**: Nuevo proveedor agregado
- **Qué se registra**: Proveedor, usuario, IP
- **Detalles**: Contiene proveedor y estado inicial (isActive: true)

### 2. UPDATE - Actualizar Configuración
- **Cuándo**: Se reemplaza la API Key
- **Qué se registra**: Valores antiguos y nuevos
- **Nota**: La API Key en sí no se almacena en el historial (solo metadatos)

### 3. DELETE - Eliminar Configuración
- **Cuándo**: Se elimina una configuración de proveedor
- **Qué se registra**: Proveedor eliminado, usuario, IP
- **Nota**: Se preserva el nombre del proveedor para referencia histórica

### 4. ACTIVATE - Activar Configuración
- **Cuándo**: Se activa una configuración desactivada
- **Qué se registra**: Cambio de `isActive: false → true`

### 5. DEACTIVATE - Desactivar Configuración
- **Cuándo**: Se desactiva una configuración activa
- **Qué se registra**: Cambio de `isActive: true → false`

---

## Cómo Acceder al Historial

### A. Interfaz Visual (Recomendado)

1. Ir a **Dashboard → Configuración → Proveedores IA**
2. Localizar la tarjeta del proveedor
3. Hacer clic en el botón **"Ver Historial"** (ícono 📋)
4. Se abrirá un modal con:
   - Timeline de cambios ordenados descendentemente (más reciente primero)
   - Badges de color según la acción (verde=CREATE, azul=UPDATE, rojo=DELETE, etc.)
   - Detalles del usuario y IP
   - Valores anteriores/nuevos si aplica
   - Botón "Actualizar" para refrescar

### B. API REST

**Endpoint:**
```
GET /api/admin/ai-providers/{configId}/history
```

**Parámetros:**
- `configId` (requerido): ID de la configuración

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "action": "ACTIVATE",
      "provider": "openai",
      "description": "Activada configuración de openai",
      "user": {
        "id": "user_123",
        "email": "admin@example.com",
        "name": "John Doe"
      },
      "ipAddress": "192.168.1.100",
      "createdAt": "2024-12-15T14:23:45.000Z",
      "changesDetails": { ... }
    }
  ]
}
```

**Ejemplo cURL:**
```bash
curl -X GET http://localhost:3000/api/admin/ai-providers/config_789/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Consultas Útiles en Base de Datos

### Ver todas las auditorías de un tenant

```sql
SELECT id, action, provider, user_id, created_at, description 
FROM ai_provider_config_audits 
WHERE tenant_id = 'tenant_123' 
ORDER BY created_at DESC;
```

### Ver cambios de un usuario específico

```sql
SELECT action, provider, description, created_at, ip_address 
FROM ai_provider_config_audits 
WHERE user_id = 'user_456' AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Ver intentos de DELETE (más sensible)

```sql
SELECT user_id, provider, description, created_at, ip_address 
FROM ai_provider_config_audits 
WHERE action = 'DELETE' AND tenant_id = 'tenant_123'
ORDER BY created_at DESC;
```

### Ver cambios en las últimas 24 horas

```sql
SELECT action, provider, user_id, created_at 
FROM ai_provider_config_audits 
WHERE tenant_id = 'tenant_123' AND created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

---

## Funciones del Sistema

### `logAiProviderChange(input)`

Registra un cambio de auditoría.

```typescript
import { logAiProviderChange } from '@/lib/ai-provider-audit'

await logAiProviderChange({
  tenantId: 'tenant_123',
  aiProviderConfigId: 'config_789',
  userId: 'user_456',
  action: 'UPDATE',
  provider: 'openai',
  changesDetails: {
    oldValues: { isActive: false },
    newValues: { isActive: true }
  },
  description: 'Actualizada configuración de openai',
  ipAddress: '192.168.1.100'
})
```

### `getAiProviderAuditHistory(configId)`

Obtiene el historial de auditoría para una configuración.

```typescript
import { getAiProviderAuditHistory } from '@/lib/ai-provider-audit'

const history = await getAiProviderAuditHistory('config_789')
// Retorna array ordenado DESC por createdAt
```

### `generateAuditDescription(action, provider)`

Genera descripción legible automáticamente.

```typescript
const desc = generateAuditDescription('UPDATE', 'openai')
// Retorna: "Actualizada configuración de openai"
```

### `getClientIpAddress(headers)`

Extrae IP del cliente desde headers.

```typescript
const ip = getClientIpAddress(request.headers)
// Soporta x-forwarded-for, x-real-ip
```

---

## Ciclo de Vida de una Configuración

### Ejemplo Completo:

1. **15:00 - CREATE** → Admin crea configuración OpenAI
   - IP: 192.168.1.100
   - Estado: isActive = true

2. **15:30 - UPDATE** → Admin actualiza la API Key
   - IP: 192.168.1.100
   - changesDetails registra cambio

3. **16:00 - DEACTIVATE** → Admin desactiva por mantenimiento
   - IP: 192.168.1.100
   - isActive: true → false

4. **17:00 - ACTIVATE** → Admin reactiva después de pruebas
   - IP: 192.168.1.100
   - isActive: false → true

5. **18:00 - DELETE** → Admin elimina por consolidación
   - IP: 192.168.1.100
   - Proveedor preservado en historial

**Todo el ciclo está auditable y consultable.**

---

## Seguridad

- ✅ **API Keys NO se almacenan** en el historial (solo metadatos)
- ✅ **IPs se registran** para rastreo de origen
- ✅ **Aislamiento multi-tenant** mediante tenantId
- ✅ **Permiso requerido** (SUPER_ADMIN, TENANT_ADMIN)
- ✅ **Cascadas de eliminación** mantienen registros históricos
- ✅ **Timestamps precisos** con sincronización de base de datos

---

## Casos de Uso

### 1. Auditoría Normativa
*"Necesitamos probar quién configuró Google Gemini el 15 de diciembre"*

→ Filtrar por provider='google', acción='CREATE', fecha=2024-12-15

### 2. Debugging de Fallos
*"El bot dejó de funcionar, ¿qué cambió en la config de OpenAI?"*

→ Ver historial de cambios recientes en OpenAI, revisar VALUES anterior/nuevo

### 3. Seguridad Incidente
*"¿Alguien eliminó configuraciones ayer a las 3 AM desde IP sospechosa?"*

→ Buscar action='DELETE' AND createdAt > '2024-12-14 03:00' AND ipAddress='...'

### 4. Reporte Mensual
*"Número de cambios de configuración en diciembre por usuario"*

→ GROUP BY user_id, COUNT(*) WHERE createdAt BETWEEN 2024-12-01 AND 2024-12-31

---

## Integración con Notificaciones (Futura)

El sistema está preparado para integrar notificaciones:

```typescript
// Ejemplo para futura implementación
await logAiProviderChange({...})

// Podría gatillar:
if (action === 'DELETE') {
  await sendSecurityAlert({
    title: 'Configuración de IA eliminada',
    user,
    provider,
    timestamp
  })
}
```

---

## FAQ

**P: ¿Cuánto tiempo se guardan los registros?**
R: Por defecto indefinidamente. Configurar política de retención según normativas (GDPR, etc.)

**P: ¿Qué pasa si se elimina un usuario?**
R: El historial permanece, referenciando el userId eliminado (preserva auditoría)

**P: ¿Se auditan los READS?**
R: No, solo CREATE/UPDATE/DELETE/ACTIVATE/DEACTIVATE (cambios)

**P: ¿Puedo filtrar por IP?**
R: Sí, mediante query directa: `WHERE ip_address = '...'`

**P: ¿Se encriptan los cambios?**
R: No se encripta el historial (debe ser auditable). Las API Keys en sí no se guardan.

---

## Archivos Relacionados

- `prisma/schema.prisma` - Definición del modelo AiProviderConfigAudit
- `src/lib/ai-provider-audit.ts` - Funciones de utilidad
- `src/components/ai-config-history-modal.tsx` - Componente visual
- `src/app/api/admin/ai-providers/route.ts` - POST/GET con logging
- `src/app/api/admin/ai-providers/[id]/route.ts` - PATCH/DELETE con logging
- `src/app/api/admin/ai-providers/[id]/history/route.ts` - Endpoint de historial
- `src/app/dashboard/admin/ai-config/page.tsx` - UI principal

---

**Fecha de Implementación:** 15 de Diciembre de 2024
**Versión:** 1.0
**Autor:** Sistema de Gestión de Eventos
