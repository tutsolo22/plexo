# 🎉 Sistema de Gestión de Eventos V3

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/manuel-tut-solorzano/Gestion-de-Eventos)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)

Sistema profesional de gestión de eventos empresariales desarrollado con
tecnologías modernas y arquitectura escalable.

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

### 🤖 **Inteligencia Artificial**

- **Agente CRM** - Asistente conversacional para gestión de clientes
- **Memoria Conversacional** - Persistencia completa de conversaciones IA
- **Integración WhatsApp** - Chatbot inteligente para reservas
- **Embeddings y Vector Search** - Búsqueda semántica en base de conocimientos
- **Coordinador de Agentes** - Orquestación de múltiples agentes especializados

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

### **Inteligencia Artificial**

- **OpenAI GPT-4** - Modelo de lenguaje principal
- **LangChain** - Framework para aplicaciones LLM
- **Prisma + PostgreSQL** - Memoria conversacional persistente
- **Pinecone/Upstash** - Vector database para embeddings
- **Vercel AI SDK** - Integración unificada de proveedores AI

### **Pagos & Facturación**

- **MercadoPago SDK** - Procesamiento de pagos LATAM
- **Webhooks** - Notificaciones de estado de pago
- **Estado de Pagos** - Seguimiento en tiempo real
- **PDFs de Facturación** - Generación automática

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

**Variables Críticas para MercadoPago:**

```env
# Obtén tu token desde: https://www.mercadopago.com.ar/developers/panel/credentials
MERCADOPAGO_ACCESS_TOKEN="TEST-YOUR_ACCESS_TOKEN_HERE"
# Para producción: APP_USR-YOUR_APP_USER_TOKEN_HERE
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

## 🔐 Credenciales de Prueba

Para probar la aplicación, utiliza las siguientes credenciales:

### **Usuario de Soporte**

- **Email**: `soporteapps@hexalux.mx`
- **Contraseña**: `password123`
- **Permisos**: Acceso completo al sistema (Super Admin)

> **Nota**: Estas credenciales se crean automáticamente al ejecutar
> `npm run db:seed`

## 💳 Configuración de MercadoPago

### **Requisitos Previos**

1. Cuenta de MercadoPago activa
2. Aplicación creada en el
   [Panel de Desarrolladores](https://www.mercadopago.com.ar/developers/panel)
3. Credenciales de Testing y Producción

### **Configuración de Credenciales**

1. **Accede al Panel de Desarrolladores**:
   https://www.mercadopago.com.ar/developers/panel
2. **Crear/Seleccionar Aplicación**: Crea una nueva aplicación o selecciona una
   existente
3. **Obtener Credenciales**:
   - Para Testing: `TEST-XXXXXXXXX-XXXXXX-XXXXXXX`
   - Para Producción: `APP_USR-XXXXXXXXX-XXXXXX-XXXXXXX`

### **Variables de Entorno**

```env
# Testing (Sandbox)
MERCADOPAGO_ACCESS_TOKEN="TEST-1234567890-032912-abcdef1234567890abcdef1234567890-123456789"

# Producción
MERCADOPAGO_ACCESS_TOKEN="APP_USR-1234567890-032912-abcdef1234567890abcdef1234567890-123456789"
```

### **URLs de Webhook**

El sistema maneja automáticamente los webhooks de MercadoPago:

```
Webhook URL: https://tu-dominio.com/api/payments/webhook
Eventos: payment, merchant_order
```

### **Flujo de Pagos**

1. **Crear Pago**: Cliente hace clic en "Pagar con MercadoPago"
2. **Redirección**: Se redirige a MercadoPago para completar el pago
3. **Webhook**: MercadoPago notifica el estado del pago
4. **Actualización**: Sistema actualiza automáticamente cotizaciones y eventos
5. **Notificación**: Cliente recibe confirmación del estado

### **Estados de Pago**

| Estado         | Descripción                            |
| -------------- | -------------------------------------- |
| `pending`      | Pago pendiente de procesamiento        |
| `approved`     | Pago aprobado exitosamente             |
| `authorized`   | Pago autorizado (pendiente de captura) |
| `in_process`   | Pago en proceso de verificación        |
| `in_mediation` | Pago en mediación                      |
| `rejected`     | Pago rechazado                         |
| `cancelled`    | Pago cancelado                         |
| `refunded`     | Pago reembolsado                       |
| `charged_back` | Pago contracargado                     |

## �🗂️ Estructura del Proyecto

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

- **[Guía de Desarrollo](docs/development/README.md)** - Setup y flujo de
  trabajo
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
- [x] Integración con MercadoPago
- [x] Sistema de pagos y webhooks

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
