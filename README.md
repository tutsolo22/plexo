# 🎉 Sistema de Gestión de Eventos V3

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/manuel-tut-solorzano/Gestion-de-Eventos)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)

Sistema profesional de gestión de eventos empresariales desarrollado con tecnologías modernas y arquitectura escalable.

## 🚀 Características Principales

### ✨ **Funcionalidades Core**
- 🏢 **Multi-tenancy** - Soporte para múltiples empresas
- 👥 **Gestión de Clientes** - 3 tipos: General, Colaborador, Externo  
- 📅 **Calendario Interactivo** - FullCalendar v6 con drag & drop
- 💰 **Sistema de Cotizaciones** - Workflow completo con aprobaciones
- 🏪 **Gestión de Espacios** - Locales, salas y configuración de precios
- ⏰ **Turnos Laborales** - Sistema flexible de horarios y precios
- 📊 **Reportes Avanzados** - Analytics y métricas de negocio
- 🔐 **Autenticación Robusta** - NextAuth.js v5 con roles jerárquicos

### 🎯 **Módulos Especializados**
- **Portal del Cliente** - Dashboard personalizado por tipo
- **Sistema de Créditos** - Para clientes externos
- **Constructor de Paquetes** - Combinaciones dinámicas
- **Generación de PDFs** - Cotizaciones y contratos
- **Notificaciones Automáticas** - Email y WhatsApp
- **Motor de Precios** - Cálculo dinámico sala+turno+cliente

## 🛠️ Stack Tecnológico

### **Frontend**
- **Next.js 15** - React framework con App Router
- **TypeScript** - Tipado estático para mayor confiabilidad
- **Tailwind CSS** - Framework CSS utilitario
- **Shadcn/ui** - Componentes accesibles y personalizables
- **React Hook Form** - Gestión eficiente de formularios
- **Zod** - Validación de esquemas

### **Backend**
- **Next.js API Routes** - Endpoints RESTful
- **Prisma ORM** - Object-Relational Mapping
- **PostgreSQL** - Base de datos relacional
- **NextAuth.js v5** - Autenticación y autorización
- **bcryptjs** - Encriptación de contraseñas

### **DevOps & Calidad**
- **Docker** - Containerización
- **ESLint + Prettier** - Linting y formateo
- **Husky** - Git hooks
- **Jest** - Testing unitario
- **Playwright** - Testing E2E
- **GitHub Actions** - CI/CD

## 📦 Instalación y Configuración

### **Prerrequisitos**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker y Docker Compose
- PostgreSQL (o usar Docker)

### **1. Clonar Repositorio**
```bash
git clone https://github.com/manuel-tut-solorzano/Gestion-de-Eventos.git
cd Gestion-de-Eventos
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**
```bash
cp .env.example .env.local
# Editar .env.local con tus configuraciones
```

### **4. Configurar Base de Datos**
```bash
# Iniciar servicios con Docker
npm run docker:dev

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar datos iniciales
npm run db:seed
```

### **5. Iniciar Desarrollo**
```bash
npm run dev
# Aplicación disponible en http://localhost:3200
```

## 🗂️ Estructura del Proyecto

```
gestion-de-eventos/
├── .github/              # Workflows y templates de GitHub
├── docs/                 # Documentación completa
│   ├── api/             # Documentación de APIs
│   ├── development/     # Guías de desarrollo
│   └── deployment/      # Guías de despliegue
├── prisma/              # Esquemas y migraciones de BD
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Componentes React
│   ├── lib/            # Utilidades y lógica de negocio
│   ├── hooks/          # Custom React hooks
│   ├── types/          # Definiciones TypeScript
│   └── utils/          # Funciones utilitarias
├── tests/              # Testing suite
└── docker/             # Configuraciones Docker
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build para producción
npm run start           # Servidor de producción

# Base de Datos
npm run db:generate     # Generar cliente Prisma
npm run db:migrate      # Ejecutar migraciones
npm run db:seed         # Poblar datos iniciales
npm run db:studio       # Interface gráfica de BD

# Calidad de Código
npm run lint            # Ejecutar linting
npm run format          # Formatear código
npm run type-check      # Verificar tipos TypeScript

# Testing
npm run test            # Tests unitarios
npm run test:e2e        # Tests end-to-end
npm run test:coverage   # Cobertura de tests

# DevOps
npm run docker:dev      # Iniciar servicios Docker
npm run release         # Generar nueva versión
```

## 📚 Documentación

- **[Guía de Desarrollo](docs/development/README.md)** - Setup y flujo de trabajo
- **[Documentación API](docs/api/README.md)** - Endpoints y ejemplos
- **[Guía de Deployment](docs/deployment/README.md)** - Despliegue en producción
- **[Manual de Usuario](docs/user-guide/README.md)** - Uso del sistema

## 🤝 Contribución

Este es un proyecto propietario. Para contribuir:

1. Lee la [Guía de Contribución](CONTRIBUTING.md)
2. Crea un fork del repositorio
3. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
4. Commit tus cambios (`git commit -m 'feat: add AmazingFeature'`)
5. Push a la rama (`git push origin feature/AmazingFeature`)
6. Abre un Pull Request

## 📋 Roadmap

### **v0.1.0 - Fundamentos** ✅
- [x] Setup inicial del proyecto
- [x] Configuración base de datos
- [x] Sistema de autenticación
- [x] APIs core del sistema

### **v0.2.0 - Gestión de Espacios** 🚧
- [ ] Gestión de identidades comerciales
- [ ] Gestión de ubicaciones y salas
- [ ] Sistema de turnos laborales
- [ ] Configuración de precios

### **v0.3.0 - Sistema de Eventos** 📅
- [ ] CRUD completo de eventos
- [ ] Verificación de disponibilidad
- [ ] Calendario interactivo
- [ ] Motor de precios dinámico

### **v1.0.0 - Lanzamiento** 🎯
- [ ] Testing integral
- [ ] Documentación completa
- [ ] Configuración de producción
- [ ] Lanzamiento comercial

## 📞 Soporte

- **Desarrollador**: Manuel Antonio Tut Solorzano
- **Email**: soporteapps@hexalux.mx
- **Empresa**: MATS Hexalux

## 📝 Licencia

Este proyecto es propietario y confidencial. Todos los derechos reservados.

---

**Desarrollado con ❤️ por MATS Hexalux**