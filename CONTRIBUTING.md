# Guía de Contribución

¡Gracias por tu interés en contribuir al Sistema de Gestión de Eventos V3! Este documento te guiará a través del proceso de contribución.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estructura de Ramas](#estructura-de-ramas)
- [Convenciones de Código](#convenciones-de-código)
- [Commits y Mensajes](#commits-y-mensajes)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentación](#documentación)

## 🤝 Código de Conducta

Este proyecto adhiere a un código de conducta profesional. Al participar, te comprometes a mantener un ambiente respetuoso y colaborativo.

## 🔄 Proceso de Desarrollo

### Flujo de Trabajo GitFlow

```
main (producción)
├── dev (desarrollo)
    ├── feature/nombre-feature
    ├── bugfix/nombre-bug
    ├── hotfix/nombre-hotfix
    └── release/version-numero
```

### Pasos para Contribuir

1. **Fork** el repositorio
2. **Clona** tu fork localmente
3. **Crea** una rama desde `dev`
4. **Desarrolla** tu funcionalidad
5. **Prueba** tu código
6. **Commit** con mensajes descriptivos
7. **Push** a tu fork
8. **Crea** un Pull Request

## 🌿 Estructura de Ramas

### Ramas Principales

- **`main`**: Código de producción estable
- **`dev`**: Rama de desarrollo activo

### Ramas de Características

- **`feature/auth-system`**: Nueva funcionalidad
- **`bugfix/login-error`**: Corrección de bugs
- **`hotfix/critical-security`**: Correcciones urgentes
- **`release/v1.2.0`**: Preparación de releases

### Nomenclatura de Ramas

```bash
# Funcionalidades
feature/descripcion-corta
feature/evento-management
feature/pricing-system

# Correcciones
bugfix/descripcion-del-bug
bugfix/calendar-display-error

# Hotfixes
hotfix/descripcion-urgente
hotfix/security-vulnerability

# Releases
release/v1.2.0
```

## 📝 Convenciones de Código

### TypeScript/JavaScript

```typescript
// ✅ Correcto
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const createUser = async (data: UserProfile): Promise<User> => {
  // Implementación
};

// ❌ Incorrecto
interface user_profile {
  ID: string;
  Name: string;
}
```

### React Components

```tsx
// ✅ Correcto - PascalCase para componentes
export function EventCalendar({ events }: EventCalendarProps) {
  return (
    <div className="calendar-container">
      {/* Contenido */}
    </div>
  );
}

// ✅ Correcto - Props interface
interface EventCalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}
```

### Estilos y CSS

```tsx
// ✅ Correcto - Tailwind CSS classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Título</h2>
</div>
```

## 💬 Commits y Mensajes

### Conventional Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[pie opcional]
```

### Tipos de Commit

- **`feat:`** - Nueva funcionalidad
- **`fix:`** - Corrección de bugs
- **`docs:`** - Cambios en documentación
- **`style:`** - Cambios de formato (espacios, comas, etc)
- **`refactor:`** - Refactorización sin cambios funcionales
- **`test:`** - Agregar o modificar tests
- **`chore:`** - Tareas de mantenimiento

### Ejemplos

```bash
# ✅ Buenos commits
feat(auth): add login functionality with email validation
fix(calendar): resolve event overlap display issue
docs(api): update endpoint documentation
test(events): add unit tests for event creation

# ❌ Malos commits
update stuff
fix bug
changes
wip
```

### Formato del Cuerpo

```bash
feat(events): add recurring event support

- Implement daily, weekly, monthly recurrence
- Add end date and occurrence count options
- Update calendar view to display recurring events
- Add validation for recurrence rules

Closes #123
```

## 🔍 Pull Requests

### Plantilla de PR

```markdown
## 📝 Descripción
Breve descripción de los cambios realizados.

## 🎯 Tipo de Cambio
- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva funcionalidad (cambio que añade funcionalidad)
- [ ] Breaking change (fix o feature que causa cambios incompatibles)
- [ ] Documentación

## ✅ Checklist
- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado áreas complejas de mi código
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevas advertencias
- [ ] He añadido tests que prueban mi fix/feature
- [ ] Tests nuevos y existentes pasan localmente

## 🧪 Testing
Describe las pruebas realizadas para verificar los cambios.

## 📱 Screenshots (si aplica)
Añade screenshots para cambios visuales.
```

### Criterios de Aceptación

- ✅ Código revisado y aprobado por al menos 1 maintainer
- ✅ Todos los tests pasan
- ✅ No hay conflictos de merge
- ✅ Documentación actualizada
- ✅ Changelog actualizado

## 🧪 Testing

### Antes de hacer Push

```bash
# Ejecutar linting
npm run lint

# Verificar tipos
npm run type-check

# Ejecutar tests unitarios
npm run test

# Ejecutar tests E2E (opcional para cambios menores)
npm run test:e2e
```

### Cobertura Mínima

- **Unit Tests**: >= 80%
- **Integration Tests**: Endpoints críticos
- **E2E Tests**: Flujos principales de usuario

### Ejemplos de Tests

```typescript
// Test unitario
describe('EventService', () => {
  it('should create event with valid data', async () => {
    const eventData = {
      title: 'Test Event',
      startDate: new Date(),
      endDate: new Date(),
    };
    
    const result = await eventService.create(eventData);
    
    expect(result.id).toBeDefined();
    expect(result.title).toBe(eventData.title);
  });
});
```

## 📚 Documentación

### Actualizar Documentación

Cuando contribuyas, asegúrate de actualizar:

- **README.md** - Si cambias instalación o uso básico
- **API Documentation** - Para cambios en endpoints
- **CHANGELOG.md** - Todos los cambios notables
- **Comentarios en código** - Para lógica compleja

### Estilo de Documentación

```typescript
/**
 * Crea un nuevo evento en el sistema
 * 
 * @param data - Datos del evento a crear
 * @param userId - ID del usuario que crea el evento
 * @returns Promise con el evento creado
 * @throws {ValidationError} Cuando los datos son inválidos
 * @throws {AuthorizationError} Cuando el usuario no tiene permisos
 * 
 * @example
 * ```typescript
 * const event = await createEvent({
 *   title: 'Reunión Mensual',
 *   startDate: new Date('2025-01-15T10:00:00Z'),
 *   endDate: new Date('2025-01-15T11:00:00Z')
 * }, 'user-123');
 * ```
 */
export async function createEvent(data: EventData, userId: string): Promise<Event> {
  // Implementación
}
```

## 🚀 Release Process

### Para Maintainers

```bash
# 1. Merge dev a main
git checkout main
git merge dev

# 2. Generar nueva versión
npm run release

# 3. Push tags
git push --follow-tags origin main

# 4. Deploy automático vía GitHub Actions
```

## ❓ Preguntas

Si tienes preguntas sobre este proceso:

- 📧 **Email**: soporteapps@hexalux.mx
- 💬 **Discussions**: Usa GitHub Discussions
- 🐛 **Issues**: Crea un issue con la etiqueta `question`

---

¡Gracias por contribuir al Sistema de Gestión de Eventos V3! 🎉