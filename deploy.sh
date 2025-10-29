#!/bin/bash

# Script de Despliegue para Gestión de Eventos
# Versión: 3.0
# Fecha: $(date)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

    if ! command_exists docker; then
        print_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi

    if ! command_exists docker-compose; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi

    print_success "Prerrequisitos verificados correctamente."
}

# Función para crear directorios necesarios
create_directories() {
    print_message "Creando directorios necesarios..."

    mkdir -p docker/ssl
    mkdir -p docker/logs
    mkdir -p docker/backups
    mkdir -p docker/nginx/ssl

    print_success "Directorios creados."
}

# Función para verificar configuración
check_configuration() {
    print_message "Verificando configuración..."

    # Prefer .env; support .env.production for backward compatibility
    if [ -f ".env" ]; then
        print_message "Cargando variables desde .env..."
        set -a
        source .env
        set +a
    elif [ -f ".env.production" ]; then
        print_message "Cargando variables desde .env.production..."
        set -a
        source .env.production
        set +a
    else
        print_error "Archivo .env o .env.production no encontrado."
        print_message "Copia .env.production.example a .env o .env.production y configura las variables."
        exit 1
    fi

    # Verificar variables críticas
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "SMTP_HOST" "SMTP_USER" "SMTP_PASS")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env.production; then
            print_error "Variable requerida ${var} no encontrada en .env.production"
            exit 1
        fi
    done

    print_success "Configuración verificada."
}

# Función para hacer backup de la base de datos
backup_database() {
    print_message "Creando backup de la base de datos..."

    if [ "$(docker ps -q -f name=gestion-eventos_postgres)" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="docker/backups/backup_${TIMESTAMP}.sql"

        docker exec gestion-eventos_postgres pg_dump -U $(grep POSTGRES_USER .env.production | cut -d '=' -f2) $(grep POSTGRES_DB .env.production | cut -d '=' -f2) > "$BACKUP_FILE"

        print_success "Backup creado: $BACKUP_FILE"
    else
        print_warning "Contenedor de PostgreSQL no está ejecutándose. Saltando backup."
    fi
}

# Función para detener servicios existentes
stop_services() {
    print_message "Deteniendo servicios existentes..."

    docker-compose -f docker-compose.prod.yml down || true

    print_success "Servicios detenidos."
}

# Función para construir imágenes
build_images() {
    print_message "Construyendo imágenes Docker..."

    docker-compose -f docker-compose.prod.yml build --no-cache

    print_success "Imágenes construidas."
}

# Función para iniciar servicios
start_services() {
    print_message "Iniciando servicios..."

    docker-compose -f docker-compose.prod.yml up -d

    print_success "Servicios iniciados."
}

# Función para esperar a que los servicios estén listos
wait_for_services() {
    print_message "Esperando a que los servicios estén listos..."

    # Esperar a PostgreSQL
    print_message "Esperando a PostgreSQL..."
    docker-compose -f docker-compose.prod.yml exec -T postgres sh -c 'while ! pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do sleep 1; done' || true

    # Esperar a Redis
    print_message "Esperando a Redis..."
    docker-compose -f docker-compose.prod.yml exec -T redis sh -c 'while ! redis-cli ping; do sleep 1; done' || true

    # Esperar a la aplicación
    print_message "Esperando a la aplicación..."
    timeout=60
    counter=0
    while ! curl -f http://localhost/health 2>/dev/null; do
        if [ $counter -ge $timeout ]; then
            print_warning "Timeout esperando a la aplicación. Puede que aún esté iniciándose."
            break
        fi
        counter=$((counter + 1))
        sleep 1
    done

    print_success "Servicios listos."
}

# Función para ejecutar migraciones de base de datos
run_migrations() {
    print_message "Ejecutando migraciones de base de datos..."

    docker-compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy

    print_success "Migraciones ejecutadas."
}

# Función para ejecutar seed de datos
run_seed() {
    print_message "Ejecutando seed de datos..."

    docker-compose -f docker-compose.prod.yml exec -T app npx tsx prisma/seed.ts

    print_success "Seed ejecutado."
}

# Función para verificar estado de los servicios
check_services() {
    print_message "Verificando estado de los servicios..."

    docker-compose -f docker-compose.prod.yml ps

    print_success "Verificación completada."
}

# Función para mostrar logs
show_logs() {
    print_message "Mostrando logs recientes..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
}

# Función principal
main() {
    echo "🚀 Iniciando despliegue de Gestión de Eventos v3.0"
    echo "================================================="

    check_prerequisites
    create_directories
    check_configuration

    read -p "¿Deseas crear un backup antes del despliegue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup_database
    fi

    stop_services
    build_images
    start_services
    wait_for_services
    run_migrations

    read -p "¿Deseas ejecutar el seed de datos? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_seed
    fi

    check_services

    echo ""
    print_success "🎉 Despliegue completado exitosamente!"
    echo ""
    print_message "Comandos útiles:"
    echo "  - Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  - Reiniciar: docker-compose -f docker-compose.prod.yml restart"
    echo "  - Detener: docker-compose -f docker-compose.prod.yml down"
    echo "  - Backup: docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U user dbname > backup.sql"
    echo ""
    print_message "La aplicación debería estar disponible en: $(grep NEXTAUTH_URL .env.production | cut -d '=' -f2)"
}

# Función de rollback
rollback() {
    print_error "Iniciando rollback..."

    stop_services

    # Restaurar backup más reciente si existe
    LATEST_BACKUP=$(ls -t docker/backups/backup_*.sql 2>/dev/null | head -1)
    if [ -f "$LATEST_BACKUP" ]; then
        print_message "Restaurando backup: $LATEST_BACKUP"
        docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $(grep POSTGRES_USER .env.production | cut -d '=' -f2) $(grep POSTGRES_DB .env.production | cut -d '=' -f2) < "$LATEST_BACKUP"
        print_success "Backup restaurado."
    fi

    start_services
    print_success "Rollback completado."
}

# Manejar argumentos de línea de comandos
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "logs")
        show_logs
        ;;
    "status")
        check_services
        ;;
    *)
        main
        ;;
esac