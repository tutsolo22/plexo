#!/bin/bash

# Script de Despliegue para Google Cloud Run
# Gestión de Eventos v3.0
# Fecha: $(date)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_ID="tu-project-id"  # Cambiar por tu project ID de GCP
SERVICE_NAME="plexo-gestion-eventos"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Función para imprimir mensajes coloreados
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar prerrequisitos
check_prerequisites() {
    print_message "Verificando prerrequisitos..."

    if ! command_exists gcloud; then
        print_error "gcloud CLI no está instalado. Instálalo desde: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    if ! command_exists docker; then
        print_error "Docker no está instalado. Instálalo desde: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # Verificar autenticación en GCP
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
        print_error "No estás autenticado en Google Cloud. Ejecuta: gcloud auth login"
        exit 1
    fi

    # Verificar que el proyecto está configurado
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
        print_warning "Proyecto actual: $CURRENT_PROJECT"
        print_message "Configurando proyecto: $PROJECT_ID"
        gcloud config set project "$PROJECT_ID"
    fi

    print_success "Prerrequisitos verificados"
}

# Construir imagen de Docker
build_image() {
    print_message "Construyendo imagen de Docker..."

    # Verificar que existe el Dockerfile.cloudrun
    if [ ! -f "Dockerfile.cloudrun" ]; then
        print_error "Dockerfile.cloudrun no encontrado"
        exit 1
    fi

    docker build -f Dockerfile.cloudrun -t "$IMAGE_NAME:latest" .
    print_success "Imagen construida exitosamente"
}

# Hacer push de la imagen a GCR
push_image() {
    print_message "Haciendo push de la imagen a Google Container Registry..."

    # Habilitar la API de Container Registry si no está habilitada
    gcloud services enable containerregistry.googleapis.com

    # Autenticar Docker con GCR
    gcloud auth configure-docker --quiet

    # Push de la imagen
    docker push "$IMAGE_NAME:latest"
    print_success "Imagen subida exitosamente"
}

# Desplegar en Cloud Run
deploy_to_cloud_run() {
    print_message "Desplegando en Google Cloud Run..."

    # Variables de entorno para Cloud Run
    ENV_VARS="
    --set-env-vars DATABASE_URL=${DATABASE_URL}
    --set-env-vars NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    --set-env-vars NEXTAUTH_URL=${NEXTAUTH_URL}
    --set-env-vars SMTP_HOST=${SMTP_HOST}
    --set-env-vars SMTP_PORT=${SMTP_PORT}
    --set-env-vars SMTP_USER=${SMTP_USER}
    --set-env-vars SMTP_PASS=${SMTP_PASS}
    --set-env-vars UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
    --set-env-vars UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
    --set-env-vars GOOGLE_API_KEY=${GOOGLE_API_KEY}
    --set-env-vars NODE_ENV=production
    --set-env-vars NEXT_TELEMETRY_DISABLED=1
    --set-env-vars LOG_LEVEL=info
    --set-env-vars ENABLE_REDIS_CACHE=true
    --set-env-vars CACHE_TTL=3600"

    # Desplegar el servicio
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_NAME:latest" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --concurrency 80 \
        --timeout 300 \
        $ENV_VARS

    print_success "Despliegue completado exitosamente"
}

# Función principal
main() {
    print_message "🚀 Iniciando despliegue en Google Cloud Run"
    print_message "Proyecto: $PROJECT_ID"
    print_message "Servicio: $SERVICE_NAME"
    print_message "Región: $REGION"

    # Cargar variables de entorno de producción
    if [ -f ".env.production" ]; then
        print_message "Cargando variables de entorno de producción..."
        set -a
        source .env.production
        set +a
    else
        print_warning ".env.production no encontrado. Asegúrate de configurar las variables manualmente"
    fi

    check_prerequisites
    build_image
    push_image
    deploy_to_cloud_run

    # Obtener la URL del servicio desplegado
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

    print_success "✅ Despliegue completado exitosamente!"
    print_message ""
    print_message "🌐 URL del servicio: $SERVICE_URL"
    print_message ""
    print_message "📋 Próximos pasos:"
    echo "  1. Verificar que la aplicación funciona correctamente"
    echo "  2. Configurar base de datos PostgreSQL en Cloud SQL"
    echo "  3. Ejecutar migraciones de Prisma: npx prisma migrate deploy"
    echo "  4. Configurar dominio personalizado si es necesario"
    echo "  5. Configurar monitoreo y alertas"
}

# Ejecutar función principal
main "$@"