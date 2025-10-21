#!/bin/bash

# Script de Despliegue Simplificado para Google Cloud Run
# Gestión de Eventos v3.0 - Source-based deployment
# Fecha: $(date)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración - EDITAR ESTOS VALORES
PROJECT_ID="TU_PROJECT_ID_AQUI"  # Cambiar por tu project ID de GCP
SERVICE_NAME="plexo-gestion-eventos"
REGION="us-central1"

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

# Verificar prerrequisitos
check_prerequisites() {
    print_message "Verificando prerrequisitos..."

    if ! command -v gcloud >/dev/null 2>&1; then
        print_error "gcloud CLI no está instalado. Instálalo desde: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    # Verificar autenticación en GCP
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 >/dev/null; then
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

# Desplegar usando source-based deployment (buildpacks)
deploy_source_based() {
    print_message "Desplegando usando source-based deployment (buildpacks)..."

    # Variables de entorno para Cloud Run
    ENV_VARS="
    --set-env-vars DATABASE_URL=${DATABASE_URL}
    --set-env-vars NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    --set-env-vars NEXTAUTH_URL=${NEXTAUTH_URL}
    --set-env-vars UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
    --set-env-vars UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
    --set-env-vars GOOGLE_API_KEY=${GOOGLE_API_KEY}
    --set-env-vars NODE_ENV=production
    --set-env-vars NEXT_TELEMETRY_DISABLED=1
    --set-env-vars PORT=8080"

    # Desplegar desde código fuente (buildpacks automático)
    gcloud run deploy "$SERVICE_NAME" \
        --source . \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --memory 2Gi \
        --cpu 1 \
        --max-instances 10 \
        --concurrency 80 \
        --timeout 900 \
        $ENV_VARS

    print_success "Despliegue completado exitosamente"
}

# Función principal
main() {
    print_message "🚀 Iniciando despliegue simplificado en Google Cloud Run"
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
    deploy_source_based

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