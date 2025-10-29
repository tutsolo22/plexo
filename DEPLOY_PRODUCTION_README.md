# 🚀 Guía de Despliegue en Producción - Plexo

## 📋 Información del Proyecto

- **Nombre**: Plexo - Gestión de Eventos v3.0
- **Repositorio de Producción**: https://github.com/tutsolo22/plexo.git
- **Plataforma**: Google Cloud Run
- **Base de Datos**: PostgreSQL (Cloud SQL)
- **Cache**: Upstash Redis

## 🔐 Credenciales de Producción

### Base de Datos
- **Usuario**: `hexaplexo`
- **Contraseña**: `DkG7vPEumStlUZNo5o2Nupi`
- **Base de datos**: `gestion_eventos_prod`

### APIs y Servicios Externos
- **Google API Key**: `AIzaSyAKwWDZ7HNsdp1l1JgVf20oG3kRNXm227E` (mantenida)
- **Upstash Redis**: Configurado y funcionando
- **SMTP**: Configurado para hexalux.mx

## 📁 Archivos de Configuración Actualizados

### ✅ .env.production
- Usuario de BD actualizado: `hexaplexo`
- Contraseña segura generada: `DkG7vPEumStlUZNo5o2Nupi`
- Variables de Redis, IA y agentes mantenidas del entorno de desarrollo

### ✅ Dockerfile.cloudrun
- Optimizado para Google Cloud Run
- Puerto 8080 (requerido por Cloud Run)
- Usuario no-root
- Health checks configurados

### ✅ Scripts de Deployment
- `migrate-to-production.sh`: Migra el código al repositorio de producción
- `deploy-cloud-run.sh`: Despliega automáticamente en Cloud Run

## 🚀 Pasos para Despliegue

### 1. Preparar el Repositorio

```bash
# Ejecutar script de migración (desde PowerShell en Windows)
./migrate-to-production.sh
```

Este script:
- Crea backup del repositorio actual
- Cambia el remote origin al repositorio de producción
- Hace push de todos los cambios

### 2. Configurar Google Cloud

#### Prerrequisitos:
- Cuenta de Google Cloud Platform
- Proyecto creado en GCP
- gcloud CLI instalado y autenticado
- Docker instalado

#### Configuración inicial:
```bash
# Instalar gcloud CLI si no lo tienes
# https://cloud.google.com/sdk/docs/install

# Autenticarse
gcloud auth login

# Configurar proyecto (reemplaza TU_PROJECT_ID)
gcloud config set project TU_PROJECT_ID

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### 3. Configurar Base de Datos (Cloud SQL)

```bash
# Crear instancia de PostgreSQL
gcloud sql instances create plexo-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Crear base de datos
gcloud sql databases create gestion_eventos_prod \
    --instance=plexo-db

# Crear usuario
gcloud sql users create hexaplexo \
    --instance=plexo-db \
    --password=DkG7vPEumStlUZNo5o2Nupi

# Obtener la IP de conexión
gcloud sql instances describe plexo-db \
    --format="value(ipAddresses[0].ipAddress)"
```

### 4. Desplegar en Cloud Run

#### Opción A: Script Automático
```bash
# Editar el script deploy-cloud-run.sh y configurar:
# - PROJECT_ID: Tu ID de proyecto de GCP
# - SERVICE_NAME: Nombre del servicio (plexo-gestion-eventos)
# - REGION: Región de GCP (us-central1 recomendado)

# Ejecutar el despliegue
./deploy-cloud-run.sh
```

#### Opción B: Despliegue Manual

```bash
# Construir imagen
docker build -f Dockerfile.cloudrun -t gcr.io/TU_PROJECT_ID/plexo-gestion-eventos:latest .

# Autenticar Docker con GCR
gcloud auth configure-docker

# Push de imagen
docker push gcr.io/TU_PROJECT_ID/plexo-gestion-eventos:latest

# Desplegar en Cloud Run
gcloud run deploy plexo-gestion-eventos \
    --image gcr.io/TU_PROJECT_ID/plexo-gestion-eventos:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars DATABASE_URL=postgresql://hexaplexo:DkG7vPEumStlUZNo5o2Nupi@IP_CLOUD_SQL:5432/gestion_eventos_prod \
    --set-env-vars NEXTAUTH_SECRET=547ad8f6fd785f8f2a5379b4fd0ef0c9e713710ec593e2560b5043a86876396a \
    --set-env-vars NEXTAUTH_URL=https://plexo.mx \
    --set-env-vars UPSTASH_REDIS_REST_URL=https://destined-bass-35398.upstash.io \
    --set-env-vars UPSTASH_REDIS_REST_TOKEN=AYpGAAIncDE1NTUxNTJlZDM5NWY0ZDdlODY0ZmQ1NzBhMmY1YjA1M3AxMzUzOTg \
    --set-env-vars GOOGLE_API_KEY=AIzaSyAKwWDZ7HNsdp1l1JgVf20oG3kRNXm227E \
    --set-env-vars NODE_ENV=production
```

### 5. Ejecutar Migraciones de Base de Datos

```bash
# Conectar a Cloud SQL y ejecutar migraciones
gcloud sql connect plexo-db --user=hexaplexo

# Dentro de PostgreSQL, ejecutar:
# \i prisma/migrations/[migration_file]/migration.sql
```

O usando Prisma directamente:
```bash
# Configurar DATABASE_URL con la conexión de Cloud SQL
export DATABASE_URL="postgresql://hexaplexo:DkG7vPEumStlUZNo5o2Nupi@IP_CLOUD_SQL:5432/gestion_eventos_prod"

# Ejecutar migraciones
npx prisma migrate deploy
```

### 6. Configuración Final

#### Health Check
Verificar que la aplicación responde:
```bash
curl https://TU_URL_DE_CLOUD_RUN/api/health
```

#### Dominio Personalizado (Opcional)
```bash
# Configurar dominio plexo.mx
gcloud run domain-mappings create \
    --service=plexo-gestion-eventos \
    --domain=plexo.mx \
    --region=us-central1
```

## 🔧 Configuración de Variables de Entorno

### Variables Críticas
- `DATABASE_URL`: Conexión a Cloud SQL
- `NEXTAUTH_SECRET`: Secreto para autenticación
- `NEXTAUTH_URL`: URL de producción (https://plexo.mx)
- `UPSTASH_REDIS_REST_URL`: URL de Redis
- `UPSTASH_REDIS_REST_TOKEN`: Token de Redis
- `GOOGLE_API_KEY`: API key de Google (mantenida)

### Variables de Email
- `SMTP_HOST`: smtp.gmail.com
- `SMTP_PORT`: 587
- `SMTP_USER`: soporteapps@hexalux.mx
- `SMTP_PASS`: Contraseña de aplicación

## 📊 Monitoreo y Mantenimiento

### Logs
```bash
# Ver logs de Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=plexo-gestion-eventos" --limit=50
```

### Métricas
- Configurar alertas en Google Cloud Monitoring
- Monitorear uso de CPU/Memoria
- Configurar uptime checks

### Backup
```bash
# Backup automático de base de datos
gcloud sql backups create gestion-eventos-backup \
    --instance=plexo-db \
    --description="Backup automático diario"
```

## 🚨 Solución de Problemas

### Error de Conexión a BD
1. Verificar IP de Cloud SQL
2. Confirmar credenciales
3. Revisar reglas de firewall

### Error de Memoria
- Aumentar memoria en Cloud Run (--memory 2Gi)
- Optimizar consultas de base de datos

### Problemas de Redis
- Verificar configuración de Upstash
- Confirmar tokens de acceso

## 📞 Soporte

Para soporte técnico:
- Revisar logs en Google Cloud Logging
- Verificar estado de servicios en GCP Console
- Contactar al equipo de desarrollo

---

**✅ Checklist de Despliegue Completado:**
- [x] Repositorio migrado a producción
- [x] Credenciales de BD configuradas
- [x] Variables de entorno actualizadas
- [x] Dockerfile optimizado para Cloud Run
- [x] Scripts de deployment preparados
- [ ] Base de datos Cloud SQL configurada
- [ ] Despliegue en Cloud Run completado
- [ ] Migraciones ejecutadas
- [ ] Dominio configurado
- [ ] Pruebas de funcionamiento realizadas