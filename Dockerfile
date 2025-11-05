# Dockerfile para Producción
# Sistema de Gestión de Eventos V3

# ================================
# Base stage
# ================================
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat curl

# Configurar directorio de trabajo
WORKDIR /app

# Deshabilitar telemetry de Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# ================================
# Dependencies stage
# ================================
FROM base AS deps

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias de producción
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# ================================
# Builder stage
# ================================
FROM base AS builder

# Copiar node_modules desde deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Configurar variables de entorno para build
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Build de la aplicación
RUN npm run build

# ================================
# Runner stage (Standalone output)
# ================================
FROM base AS runner

# Configurar variables de entorno
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Crear directorios necesarios
RUN mkdir -p /app/.next/cache
RUN chown -R nextjs:nodejs /app

# Copiar archivos públicos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copiar static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicio: ejecutar migraciones y luego Next.js
CMD sh -c "npx prisma migrate deploy --skip-generate || true && node server.js"