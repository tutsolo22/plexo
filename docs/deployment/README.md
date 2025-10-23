# Guía de Despliegue - Gestión de Eventos v3.0

## 📋 Resumen Ejecutivo

Esta guía proporciona instrucciones completas para desplegar el Sistema de Gestión de Eventos v3.0 en entornos de producción usando Docker y Docker Compose.

## 🏗️ Arquitectura de Despliegue

### Servicios
- **Aplicación Next.js**: Frontend y API REST
- **PostgreSQL**: Base de datos principal
- **Redis**: Cache y sesiones
- **Nginx**: Proxy reverso y balanceo de carga

### Infraestructura
- Contenedorización completa con Docker
- Orquestación con Docker Compose
- Configuración de producción optimizada
- SSL/TLS con Let's Encrypt
- Rate limiting y seguridad

## 📋 Prerrequisitos

### Sistema Operativo
- Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- Windows Server 2019+ (con WSL2)
- macOS 10.15+

### Software Requerido
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl/wget

### Recursos Mínimos
- CPU: 2 cores
- RAM: 4GB
- Disco: 20GB SSD
- Red: 100Mbps

## 🚀 Despliegue Rápido

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/gestion-eventos.git
cd gestion-eventos
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
nano .env  # Editar con tus valores
```

### 3. Ejecutar Despliegue
```bash
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Configuración Detallada

### Variables de Entorno

Copia `.env.example` a `.env` y configura (o usa `.env.production` para compatibilidad):

#### Base de Datos
```env
DATABASE_URL=postgresql://user:password@postgres:5432/gestion_eventos
POSTGRES_DB=gestion_eventos
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password_seguro
```

#### Autenticación
```env
NEXTAUTH_SECRET=genera-un-secreto-seguro-de-al-menos-32-caracteres
NEXTAUTH_URL=https://tu-dominio.com
```

#### Email SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
```

### SSL/TLS Configuration

#### Opción 1: Let's Encrypt (Recomendado)
```bash
# Instalar Certbot
sudo apt install certbot

# Generar certificado
sudo certbot certonly --standalone -d tu-dominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem docker/nginx/ssl/
```

#### Opción 2: Certificado Personalizado
Coloca tus archivos `cert.pem` y `key.pem` en `docker/nginx/ssl/`

## 🔧 Comandos de Gestión

### Verificar Estado
```bash
./deploy.sh status
```

### Ver Logs
```bash
./deploy.sh logs
# o en tiempo real:
docker-compose -f docker-compose.prod.yml logs -f
```

### Reiniciar Servicios
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Actualizar Aplicación
```bash
git pull origin main
./deploy.sh
```

### Backup de Base de Datos
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U user dbname > backup_$(date +%Y%m%d).sql
```

### Restaurar Backup
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U user dbname < backup.sql
```

### Rollback de Emergencia
```bash
./deploy.sh rollback
```

## 🔒 Seguridad

### Configuración SSL
- Certificados SSL/TLS obligatorios
- Headers de seguridad configurados
- Rate limiting activado

### Variables Sensibles
- Nunca commits `.env.production`
- Usa secrets de Docker/Kubernetes
- Rota credenciales regularmente

### Firewall
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 📊 Monitoreo

### Logs de Aplicación
```bash
# Logs de Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Logs de aplicación
docker-compose -f docker-compose.prod.yml logs app

# Logs de base de datos
docker-compose -f docker-compose.prod.yml logs postgres
```

### Métricas de Rendimiento
- Monitorea uso de CPU/RAM con `docker stats`
- Revisa logs de errores regularmente
- Configura alertas para downtime

### Health Checks
```bash
# Health check manual
curl -f https://tu-dominio.com/api/health

# Health check de base de datos
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U user -d dbname
```

## 🔄 Actualizaciones

### Estrategia Blue-Green
```bash
# Crear nueva versión
docker tag gestion-eventos_app:latest gestion-eventos_app:v2

# Actualizar docker-compose.prod.yml con nueva imagen
docker-compose -f docker-compose.prod.yml up -d

# Verificar funcionamiento
curl -f https://tu-dominio.com/api/health

# Si OK, eliminar versión anterior
docker rmi gestion-eventos_app:latest
```

### Zero-Downtime Updates
```bash
# Escalar a múltiples instancias
docker-compose -f docker-compose.prod.yml up -d --scale app=2

# Actualizar una instancia a la vez
docker-compose -f docker-compose.prod.yml up -d --scale app=1 --no-deps app

# Verificar y escalar de vuelta
docker-compose -f docker-compose.prod.yml up -d --scale app=2
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### Puerto 80/443 Ocupado
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :80
sudo lsof -i :443

# Matar proceso si es necesario
sudo kill -9 PID
```

#### Error de Conexión a Base de Datos
```bash
# Verificar contenedor de PostgreSQL
docker-compose -f docker-compose.prod.yml ps postgres

# Revisar logs
docker-compose -f docker-compose.prod.yml logs postgres

# Conectar manualmente
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d dbname
```

#### Error de Build
```bash
# Limpiar cache de Docker
docker system prune -f

# Reconstruir sin cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

#### Memoria Insuficiente
```bash
# Verificar uso de memoria
docker stats

# Aumentar límites en docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Logs de Debug
```bash
# Habilitar debug en .env.production
DEBUG=true
LOG_LEVEL=debug

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart app
```

## 📈 Escalabilidad

### Horizontal Scaling
```bash
# Escalar aplicación
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Escalar base de datos (requiere configuración adicional)
# Usar PostgreSQL con replicas o servicios gestionados
```

### Vertical Scaling
```bash
# Aumentar recursos
# Editar docker-compose.prod.yml con más CPU/RAM
docker-compose -f docker-compose.prod.yml up -d
```

### CDN Integration
```bash
# Configurar CDN_URL en .env.production
CDN_URL=https://cdn.tu-dominio.com
CDN_ENABLED=true
```

## 🔧 Mantenimiento

### Tareas Programadas
```bash
# Backup diario (agregar a crontab)
0 2 * * * /path/to/gestion-eventos/docker/backup.sh

# Rotación de logs
0 3 * * * docker-compose -f /path/to/docker-compose.prod.yml logs --no-color > logs/$(date +\%Y\%m\%d).log

# Actualización de certificados SSL
0 12 * * * certbot renew --quiet
```

### Limpieza
```bash
# Limpiar imágenes no utilizadas
docker image prune -f

# Limpiar contenedores detenidos
docker container prune -f

# Limpiar volúmenes no utilizados
docker volume prune -f
```

## 🌐 Opciones de Deployment Alternativas

### Vercel (Para prototipos/desarrollo)

1. **Conectar repositorio a Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   ```

2. **Configurar variables de entorno**
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_SECRET
   # ... agregar todas las variables
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### AWS EC2 + RDS

#### Arquitectura
- EC2 instance para la aplicación
- RDS PostgreSQL para la base de datos
- ElastiCache Redis (opcional)
- CloudFront + S3 (opcional para assets)

#### Despliegue
```bash
# En EC2 instance
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Clonar y configurar
git clone https://github.com/tu-usuario/gestion-eventos.git
cd gestion-eventos
cp .env.production.example .env.production
# Configurar variables...

# Ejecutar despliegue
chmod +x deploy.sh
./deploy.sh
```

## 📞 Soporte

### Contactos
- Email: soporte@tu-empresa.com
- Slack: #sistemas
- Documentación: https://docs.tu-empresa.com

### Información del Sistema
```bash
# Recopilar información para soporte
docker --version
docker-compose --version
uname -a
df -h
free -h
```

---

## 📋 Checklist de Despliegue

- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas
- [ ] Certificados SSL instalados
- [ ] Firewall configurado
- [ ] Despliegue ejecutado exitosamente
- [ ] Health checks funcionando
- [ ] Backup inicial realizado
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

¡Tu sistema de Gestión de Eventos v3.0 está listo para producción! 🎉
┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   PostgreSQL    │
│     (EC2)       │◄──►│     (RDS)       │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│     Redis       │
│   (ElastiCache) │
└─────────────────┘
```

#### Pasos de Deployment

1. **Crear VPC y Security Groups**
   ```bash
   # Crear VPC
   aws ec2 create-vpc --cidr-block 10.0.0.0/16

   # Crear security group para aplicación
   aws ec2 create-security-group \
     --group-name app-sg \
     --description "Security group for app"
   ```

2. **Configurar RDS PostgreSQL**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier gestion-eventos-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password your-password \
     --allocated-storage 20
   ```

3. **Configurar EC2 Instance**
   ```bash
   # Crear instancia EC2
   aws ec2 run-instances \
     --image-id ami-12345678 \
     --count 1 \
     --instance-type t3.micro \
     --key-name your-key-pair
   ```

4. **Instalar dependencias en EC2**
   ```bash
   # Conectar via SSH
   ssh -i your-key.pem ec2-user@your-instance-ip

   # Instalar Node.js
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18

   # Instalar PM2
   npm install -g pm2

   # Clonar repositorio
   git clone https://github.com/your-org/gestion-eventos.git
   cd gestion-eventos

   # Instalar dependencias
   npm ci

   # Build aplicación
   npm run build
   ```

5. **Configurar PM2**
   ```json
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'gestion-eventos',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         DATABASE_URL: 'postgresql://...',
         NEXTAUTH_SECRET: '...',
         NEXTAUTH_URL: 'https://your-domain.com'
       }
     }]
   }
   ```

6. **Configurar Nginx (Reverse Proxy)**
   ```nginx
   # /etc/nginx/sites-available/gestion-eventos
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 3. 🌊 DigitalOcean (App Platform + Database)

#### Configuración con App Spec

```yaml
# .do/app.yaml
name: gestion-eventos
services:
- name: web
  source_dir: /
  github:
    repo: your-org/gestion-eventos
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${database.DATABASE_URL}
  - key: NEXTAUTH_SECRET
    value: ${NEXTAUTH_SECRET}
  - key: NEXTAUTH_URL
    value: ${APP_URL}

databases:
- name: db
  engine: PG
  version: 15
  size: basic
  num_nodes: 1
```

#### Deployment Steps

1. **Crear app en DigitalOcean**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

2. **Configurar dominio**
   ```bash
   doctl apps update your-app-id --spec .do/app.yaml
   ```

### 4. 🐳 Docker Deployment

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose para Producción

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=gestion_eventos
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Comandos de Deployment

```bash
# Construir y ejecutar
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# Seed database
docker-compose -f docker-compose.prod.yml exec app npm run db:seed
```

---

## 🔧 Configuración de Base de Datos

### Migraciones en Producción

```bash
# Ejecutar migraciones
npm run db:migrate

# Verificar estado
npx prisma migrate status

# Resolver conflictos si existen
npx prisma migrate resolve --applied 20250101000000_migration_name
```

### Seeds para Producción

```bash
# Ejecutar seeds
npm run db:seed

# Seeds específicos
npm run seed:sandbox  # Para entorno de pruebas
npm run seed:prod     # Para producción
```

---

## 📊 Monitoreo y Logs

### Configuración de Logs

```bash
# PM2 logs
pm2 logs gestion-eventos

# Ver logs de aplicación
tail -f /var/log/gestion-eventos/app.log

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Endpoint de health check
curl https://your-domain.com/api/health

# Database connection check
curl https://your-domain.com/api/health/db
```

---

## 🔒 Seguridad

### Configuración SSL/TLS

```nginx
# Configuración SSL en Nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Configuración SSL optima
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
}
```

### Variables de Entorno Seguras

```bash
# Nunca commitear estas variables
echo ".env.local" >> .gitignore

# Usar secrets en CI/CD
# Vercel: Settings > Environment Variables
# GitHub: Settings > Secrets and variables > Actions
```

---

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión a BD**
   ```bash
   # Verificar conexión
   npx prisma db push --preview-feature

   # Ver logs de BD
   docker logs gestion-eventos-postgres
   ```

2. **Error de build**
   ```bash
   # Limpiar cache
   rm -rf .next node_modules/.cache

   # Reinstalar dependencias
   npm ci

   # Build con debug
   DEBUG=* npm run build
   ```

3. **Error de memoria**
   ```bash
   # Aumentar límite de memoria de Node
   export NODE_OPTIONS="--max-old-space-size=4096"

   # O configurar en PM2
   pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"
   ```

---

## 📈 Escalabilidad

### Optimizaciones de Performance

1. **Configuración de Redis Cache**
   ```typescript
   // En producción, usar Redis para sesiones
   export const redis = new Redis(process.env.REDIS_URL)
   ```

2. **CDN para Assets Estáticos**
   ```typescript
   // next.config.js
   module.exports = {
     images: {
       domains: ['cdn.your-domain.com'],
     },
   }
   ```

3. **Database Indexing**
   ```sql
   -- Índices importantes para performance
   CREATE INDEX CONCURRENTLY idx_events_date ON events(date);
   CREATE INDEX CONCURRENTLY idx_quotes_status ON quotes(status);
   CREATE INDEX CONCURRENTLY idx_clients_email ON clients(email);
   ```

---

## 📞 Soporte

Para problemas de deployment, revisar:

1. **Logs de aplicación**: `pm2 logs` o `/var/log/app/`
2. **Logs de servidor**: `/var/log/nginx/` o `/var/log/apache2/`
3. **Logs de base de datos**: `docker logs db-container`
4. **Monitoreo**: Configurar alertas en el proveedor de hosting

---

*Última actualización: Octubre 2025*