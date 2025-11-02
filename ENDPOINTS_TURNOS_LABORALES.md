# API de Gestión de Turnos Laborales

Documentación de los endpoints para gestionar turnos laborales y días de trabajo.

## Endpoints Disponibles

### 1. Turnos Laborales (Work Shifts)

#### `GET /api/work-shifts`
Obtiene todos los turnos laborales del tenant.

**Query Parameters:**
- `isActive` (opcional): `true` | `false` - Filtrar por estado activo

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx123",
      "name": "Turno Matutino",
      "startTime": "08:00",
      "endTime": "14:00",
      "description": "Turno de la mañana",
      "isActive": true,
      "roomsCount": 5,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/work-shifts`
Crea un nuevo turno laboral.

**Permisos requeridos:** `SUPER_ADMIN` o `TENANT_ADMIN`

**Body:**
```json
{
  "name": "Turno Vespertino",
  "startTime": "14:00",
  "endTime": "20:00",
  "description": "Turno de la tarde",
  "isActive": true
}
```

**Validaciones:**
- El nombre es requerido (max 100 caracteres)
- Formato de hora: `HH:MM` (24 horas)
- No puede solaparse con otros turnos activos
- `startTime` debe ser anterior a `endTime`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx456",
    "name": "Turno Vespertino",
    "startTime": "14:00",
    "endTime": "20:00",
    "description": "Turno de la tarde",
    "isActive": true,
    "createdAt": "2025-01-15T11:00:00Z"
  },
  "message": "Turno laboral creado exitosamente"
}
```

#### `GET /api/work-shifts/[id]`
Obtiene un turno laboral específico con sus precios de salas asociados.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx123",
    "name": "Turno Matutino",
    "startTime": "08:00",
    "endTime": "14:00",
    "description": "Turno de la mañana",
    "isActive": true,
    "roomPricing": [
      {
        "id": "clyyy123",
        "room": {
          "id": "clzzz123",
          "name": "Sala Principal"
        },
        "priceList": {
          "id": "claaa123",
          "name": "Precio Estándar"
        },
        "price": 5000
      }
    ],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

#### `PUT /api/work-shifts/[id]`
Actualiza un turno laboral.

**Permisos requeridos:** `SUPER_ADMIN` o `TENANT_ADMIN`

**Body (todos los campos son opcionales):**
```json
{
  "name": "Turno Matutino Actualizado",
  "startTime": "07:00",
  "endTime": "13:00",
  "description": "Nueva descripción",
  "isActive": false
}
```

**Validaciones:**
- Si se actualizan horarios, no pueden solaparse con otros turnos activos
- `startTime` debe ser anterior a `endTime`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx123",
    "name": "Turno Matutino Actualizado",
    "startTime": "07:00",
    "endTime": "13:00",
    "description": "Nueva descripción",
    "isActive": false,
    "updatedAt": "2025-01-15T12:00:00Z"
  },
  "message": "Turno laboral actualizado exitosamente"
}
```

#### `DELETE /api/work-shifts/[id]`
Elimina un turno laboral.

**Permisos requeridos:** `SUPER_ADMIN` o `TENANT_ADMIN`

**Validaciones:**
- No se puede eliminar si tiene precios de salas asociados
- Se recomienda desactivar (`isActive: false`) en lugar de eliminar

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx123"
  },
  "message": "Turno laboral eliminado exitosamente"
}
```

### 2. Configuración de Días Laborables

#### `GET /api/work-shifts/config/working-days`
Obtiene la configuración de días laborables de la semana.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": true,
    "sunday": false
  }
}
```

**Valores por defecto:**
- Lunes a Sábado: `true` (laborables)
- Domingo: `false` (no laboral)

#### `PUT /api/work-shifts/config/working-days`
Actualiza la configuración de días laborables.

**Permisos requeridos:** `SUPER_ADMIN` o `TENANT_ADMIN`

**Body:**
```json
{
  "monday": true,
  "tuesday": true,
  "wednesday": true,
  "thursday": true,
  "friday": true,
  "saturday": false,
  "sunday": false
}
```

**Validaciones:**
- Todos los campos son booleanos
- Al menos un día debe estar activo (`true`)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "message": "Configuración de días laborables actualizada exitosamente"
}
```

## Casos de Uso

### Ejemplo 1: Configurar horarios de una Casona de Eventos

```javascript
// 1. Configurar días laborables (Lunes a Domingo)
const workingDays = await fetch('/api/work-shifts/config/working-days', {
  method: 'PUT',
  body: JSON.stringify({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true
  })
});

// 2. Crear turnos
const turnoMatutino = await fetch('/api/work-shifts', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Turno Matutino',
    startTime: '08:00',
    endTime: '14:00',
    description: 'Eventos de la mañana'
  })
});

const turnoVespertino = await fetch('/api/work-shifts', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Turno Vespertino',
    startTime: '14:00',
    endTime: '20:00',
    description: 'Eventos de la tarde'
  })
});

const turnoNocturno = await fetch('/api/work-shifts', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Turno Nocturno',
    startTime: '20:00',
    endTime: '02:00',
    description: 'Eventos de la noche'
  })
});
```

### Ejemplo 2: Desactivar temporalmente un turno

```javascript
// Desactivar turno sin eliminarlo
const response = await fetch('/api/work-shifts/clxxx123', {
  method: 'PUT',
  body: JSON.stringify({
    isActive: false
  })
});
```

### Ejemplo 3: Obtener turnos activos

```javascript
// Solo turnos activos
const response = await fetch('/api/work-shifts?isActive=true');
const { data: activeShifts } = await response.json();
```

## Errores Comunes

### Error 400: Horarios solapados
```json
{
  "success": false,
  "error": "Este horario se solapa con el turno \"Turno Matutino\" (08:00 - 14:00)"
}
```

**Solución:** Ajusta los horarios para que no se solapen con otros turnos activos.

### Error 400: No se puede eliminar
```json
{
  "success": false,
  "error": "No se puede eliminar este turno porque tiene 5 precio(s) de salas asociados. Desactívalo en lugar de eliminarlo."
}
```

**Solución:** Usa `PUT` para desactivar el turno (`isActive: false`) en lugar de eliminarlo.

### Error 400: Al menos un día activo
```json
{
  "success": false,
  "error": "Debe haber al menos un día laboral activo"
}
```

**Solución:** Asegúrate de tener al menos un día en `true`.

## Notas Técnicas

- Los horarios se almacenan con una fecha base (`1970-01-01`) para representar solo la hora
- Las horas se formatean en formato 24 horas (`HH:MM`)
- Los turnos se asocian a precios de salas mediante la tabla `RoomPricing`
- La configuración de días laborables se almacena en la tabla `Configuration` con la clave `working_days`
- Todos los endpoints requieren autenticación mediante NextAuth
- Los turnos están aislados por tenant (multi-tenancy)
