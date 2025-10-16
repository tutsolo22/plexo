# Changelog

Todos los cambios importantes de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Estructura inicial del proyecto
- Configuración de desarrollo con Next.js 15
- Sistema de versionado semántico
- Configuración de ESLint y Prettier
- Git hooks con Husky
- Documentación inicial

---

## [0.1.0] - 2025-10-15

### Added
- **Proyecto Inicial**: Configuración base del Sistema de Gestión de Eventos V3
- **Stack Tecnológico**: Next.js 15, TypeScript, Tailwind CSS, Prisma ORM
- **Estructura de Desarrollo**: ESLint, Prettier, Husky, Conventional Commits
- **Documentación**: README completo, CONTRIBUTING guidelines, estructura de carpetas
- **Docker**: Configuración para desarrollo con PostgreSQL
- **CI/CD**: GitHub Actions preparado para deployment
- **Testing**: Jest y Playwright configurados
- **Versionado**: Standard-version para releases automáticos

### Technical Details
- Node.js >= 18.0.0 requerido
- Puerto de desarrollo: 3200
- Base de datos: PostgreSQL con Prisma ORM
- Autenticación: NextAuth.js v5
- UI Framework: Shadcn/ui + Radix UI

---

## Tipos de Cambios

- `Added` - Nuevas características
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Características que se eliminarán pronto
- `Removed` - Características eliminadas
- `Fixed` - Corrección de bugs
- `Security` - Vulnerabilidades de seguridad

---

## Formato de Commits

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (espacios, comas, etc)
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Tareas de mantenimiento