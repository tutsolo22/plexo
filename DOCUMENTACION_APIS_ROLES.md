# APIs REST para Gestión de Roles Flexibles
## Sistema de Gestión de Eventos - CRM Casona María

### Resumen
Sistema completo de APIs REST para la gestión del nuevo sistema de roles flexibles implementado. Incluye endpoints para CRUD de roles, gestión de permisos, y asignación de roles a usuarios.

## 🚀 Endpoints Implementados

### 1. Gestión de Roles (`/api/roles`)

#### GET `/api/roles`
Obtiene los roles disponibles para el tenant actual.

**Query Parameters:**
- `action` (opcional): 
  - Sin valor: Lista roles del tenant
  - `user-roles`: Obtiene roles de un usuario específico (requiere `userId`)
  - `check-permission`: Verifica un permiso específico

**Ejemplos:**
```bash
# Obtener todos los roles del tenant
GET /api/roles

# Obtener roles de un usuario específico
GET /api/roles?action=user-roles&userId=user-123

# Verificar permiso específico
GET /api/roles?action=check-permission&userId=user-123&permissionAction=CREATE&resource=EVENT
```

#### POST `/api/roles`
Crea un nuevo rol o asigna un rol a un usuario.

**Query Parameters:**
- `action` (opcional):
  - Sin valor o `create`: Crear nuevo rol
  - `assign`: Asignar rol a usuario

**Ejemplos:**
```bash
# Crear nuevo rol
POST /api/roles
Content-Type: application/json

{
  "name": "Event Coordinator",
  "description": "Coordinador de eventos con permisos específicos",
  "type": "CUSTOM",
  "permissions": [
    {
      "action": "CREATE",
      "resource": "EVENT",
      "conditions": {}
    },
    {
      "action": "READ",
      "resource": "EVENT",
      "conditions": {}
    }
  ]
}

# Asignar rol a usuario
POST /api/roles?action=assign
Content-Type: application/json

{
  "userId": "user-123",
  "roleId": "role-456",
  "isPrimary": false,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### PUT `/api/roles`
Actualiza un rol existente.

**Query Parameters:**
- `roleId` (requerido): ID del rol a actualizar

**Ejemplo:**
```bash
PUT /api/roles?roleId=role-123
Content-Type: application/json

{
  "name": "Event Coordinator Updated",
  "description": "Descripción actualizada",
  "permissions": [
    {
      "action": "CREATE",
      "resource": "EVENT"
    },
    {
      "action": "UPDATE",
      "resource": "EVENT"
    }
  ]
}
```

#### DELETE `/api/roles`
Elimina un rol del sistema o remueve un rol de un usuario.

**Query Parameters:**
- `action` (opcional):
  - Sin valor: Remover rol de usuario (requiere `userId` y `roleId`)
  - `delete-role`: Eliminar rol del sistema (requiere `roleId`)

**Ejemplos:**
```bash
# Remover rol de usuario
DELETE /api/roles?userId=user-123&roleId=role-456

# Eliminar rol del sistema
DELETE /api/roles?action=delete-role&roleId=role-456
```

### 2. Gestión de Roles Individuales (`/api/roles/[id]`)

#### GET `/api/roles/[id]`
Obtiene un rol específico por ID.

```bash
GET /api/roles/role-123
```

#### PUT `/api/roles/[id]`
Actualiza un rol específico.

```bash
PUT /api/roles/role-123
Content-Type: application/json

{
  "name": "Nuevo nombre del rol",
  "description": "Nueva descripción",
  "isActive": true,
  "permissions": [...]
}
```

#### DELETE `/api/roles/[id]`
Elimina un rol específico.

```bash
DELETE /api/roles/role-123
```

### 3. Gestión de Permisos (`/api/permissions`)

#### GET `/api/permissions`
Obtiene información sobre permisos disponibles.

**Query Parameters:**
- `action` (requerido):
  - `available`: Lista todas las acciones y recursos disponibles
  - `user-permissions`: Obtiene permisos efectivos de un usuario

**Ejemplos:**
```bash
# Obtener acciones y recursos disponibles
GET /api/permissions?action=available

# Obtener permisos efectivos de un usuario
GET /api/permissions?action=user-permissions&userId=user-123
```

#### POST `/api/permissions`
Verifica permisos de usuarios.

**Query Parameters:**
- `action` (opcional):
  - Sin valor o `check`: Verificar un permiso específico
  - `bulk-check`: Verificar múltiples permisos

**Ejemplos:**
```bash
# Verificar un permiso específico
POST /api/permissions
Content-Type: application/json

{
  "userId": "user-123",
  "action": "CREATE",
  "resource": "EVENT",
  "conditions": {}
}

# Verificar múltiples permisos
POST /api/permissions?action=bulk-check
Content-Type: application/json

{
  "userId": "user-123",
  "permissions": [
    {
      "action": "CREATE",
      "resource": "EVENT"
    },
    {
      "action": "DELETE",
      "resource": "EVENT"
    }
  ]
}
```

### 4. Gestión de Roles de Usuario (`/api/users/[id]/roles`)

#### GET `/api/users/[id]/roles`
Obtiene los roles asignados a un usuario específico.

**Query Parameters:**
- `includePermissions` (opcional): `true` para incluir permisos efectivos

**Ejemplos:**
```bash
# Obtener roles del usuario
GET /api/users/user-123/roles

# Obtener roles y permisos efectivos
GET /api/users/user-123/roles?includePermissions=true
```

#### POST `/api/users/[id]/roles`
Asigna un rol a un usuario específico.

```bash
POST /api/users/user-123/roles
Content-Type: application/json

{
  "roleId": "role-456",
  "isPrimary": false,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### PUT `/api/users/[id]/roles`
Actualiza la asignación de un rol a un usuario.

**Query Parameters:**
- `roleId` (requerido): ID del rol a actualizar

```bash
PUT /api/users/user-123/roles?roleId=role-456
Content-Type: application/json

{
  "isPrimary": true,
  "expiresAt": null
}
```

#### DELETE `/api/users/[id]/roles`
Remueve un rol de un usuario específico.

**Query Parameters:**
- `roleId` (requerido): ID del rol a remover

```bash
DELETE /api/users/user-123/roles?roleId=role-456
```

## 📋 Tipos de Datos

### RoleType (Enum)
```typescript
enum RoleType {
  SUPER_ADMIN = "SUPER_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN", 
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
  USER = "USER",
  CLIENT_INTERNAL = "CLIENT_INTERNAL",
  CLIENT_EXTERNAL = "CLIENT_EXTERNAL",
  CUSTOM = "CUSTOM"
}
```

### PermissionAction (Enum)
```typescript
enum PermissionAction {
  CREATE = "CREATE",
  READ = "READ", 
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  MANAGE = "MANAGE",
  APPROVE = "APPROVE",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT"
}
```

### PermissionResource (Enum)
```typescript
enum PermissionResource {
  USER = "USER",
  ROLE = "ROLE", 
  EVENT = "EVENT",
  CLIENT = "CLIENT",
  QUOTE = "QUOTE",
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE",
  VENUE = "VENUE",
  REPORT = "REPORT",
  SYSTEM = "SYSTEM",
  TENANT = "TENANT"
}
```

## 🔒 Autenticación y Autorización

Todas las APIs requieren autenticación mediante Next-Auth. El usuario debe tener los permisos adecuados para realizar cada operación:

- **Crear/Editar/Eliminar roles**: Requiere permisos de `MANAGE` en recurso `ROLE`
- **Asignar/Remover roles**: Requiere permisos de `MANAGE` en recurso `USER`
- **Ver roles y permisos**: Requiere permisos de `READ` en recursos correspondientes

## 📝 Respuestas de la API

### Respuesta Exitosa
```json
{
  "success": true,
  "data": { /* datos solicitados */ },
  "message": "Operación completada exitosamente"
}
```

### Respuesta de Error
```json
{
  "error": "Descripción del error",
  "details": [ /* detalles adicionales si aplica */ ]
}
```

## 🔄 Códigos de Estado HTTP

- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Solicitud incorrecta o datos inválidos
- `401`: No autorizado
- `403`: Prohibido (sin permisos suficientes)
- `404`: Recurso no encontrado
- `409`: Conflicto (ej: recurso ya existe)
- `500`: Error interno del servidor
- `501`: No implementado

## 🧪 Estado Actual

### ✅ Completado
- [x] Estructura de endpoints REST completa
- [x] Validación de datos con Zod
- [x] Manejo de errores y códigos HTTP
- [x] Autenticación con Next-Auth
- [x] Operaciones CRUD completas para roles
- [x] Gestión de permisos y verificación
- [x] Asignación y desasignación de roles a usuarios

### ⚠️ En Progreso
- [ ] Corrección de errores de TypeScript por migración de esquema
- [ ] Actualización de middleware de autenticación
- [ ] Integración completa con el nuevo sistema de roles

### 📝 Pendiente
- [ ] Tests unitarios y de integración
- [ ] Documentación interactiva (Swagger/OpenAPI)
- [ ] Rate limiting y throttling
- [ ] Logs de auditoría para cambios de roles

---

**Fecha de actualización:** 16 de Octubre, 2024
**Versión:** 1.0.0
**Desarrollado para:** Sistema de Gestión de Eventos - CRM Casona María