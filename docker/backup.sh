#!/bin/bash

# Script de Backup para Gestión de Eventos
# Versión: 1.0
# Fecha: $(date)

set -e

# Configuración
BACKUP_DIR="docker/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
LOG_FILE="$BACKUP_DIR/backup_$TIMESTAMP.log"

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

# Función para log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Función para verificar prerrequisitos
check_prerequisites() {
    print_message "Verificando prerrequisitos..."

    if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
        print_error "Archivo .env o .env.production no encontrado"
        exit 1
    fi

    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "gestion-eventos_postgres"; then
        print_error "Contenedor de PostgreSQL no está ejecutándose"
        exit 1
    fi

    print_success "Prerrequisitos verificados"
}

# Función para crear directorio de backups
create_backup_dir() {
    print_message "Creando directorio de backups..."
    mkdir -p "$BACKUP_DIR"
    print_success "Directorio creado: $BACKUP_DIR"
}

# Función para hacer backup
perform_backup() {
    print_message "Iniciando backup de base de datos..."
    log "Iniciando backup"

    # Obtener credenciales del archivo .env (o .env.production como fallback)
    if [ -f ".env" ]; then
        DB_USER=$(grep POSTGRES_USER .env | cut -d '=' -f2)
        DB_NAME=$(grep POSTGRES_DB .env | cut -d '=' -f2)
    else
        DB_USER=$(grep POSTGRES_USER .env.production | cut -d '=' -f2)
        DB_NAME=$(grep POSTGRES_DB .env.production | cut -d '=' -f2)
    fi

    if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        print_error "No se pudieron obtener las credenciales de la base de datos"
        exit 1
    fi

    # Crear backup
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
        print_success "Backup creado exitosamente: $BACKUP_FILE"
        log "Backup creado exitosamente: $BACKUP_FILE"

        # Comprimir backup
        gzip "$BACKUP_FILE"
        COMPRESSED_FILE="$BACKUP_FILE.gz"
        print_success "Backup comprimido: $COMPRESSED_FILE"
        log "Backup comprimido: $COMPRESSED_FILE"

        # Mostrar tamaño del archivo
        FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        print_message "Tamaño del backup: $FILE_SIZE"
        log "Tamaño del backup: $FILE_SIZE"

    else
        print_error "Error al crear el backup"
        log "ERROR: Error al crear el backup"
        exit 1
    fi
}

# Función para verificar integridad del backup
verify_backup() {
    print_message "Verificando integridad del backup..."

    COMPRESSED_FILE="$BACKUP_FILE.gz"

    if [ ! -f "$COMPRESSED_FILE" ]; then
        print_error "Archivo de backup no encontrado: $COMPRESSED_FILE"
        exit 1
    fi

    # Descomprimir y verificar
    if gunzip -c "$COMPRESSED_FILE" > /dev/null 2>> "$LOG_FILE"; then
        print_success "Backup verificado correctamente"
        log "Backup verificado correctamente"
    else
        print_error "Backup corrupto o inválido"
        log "ERROR: Backup corrupto o inválido"
        exit 1
    fi
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    print_message "Limpiando backups antiguos..."

    # Mantener solo los últimos 30 backups
    RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

    # Encontrar y eliminar backups antiguos
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -exec rm {} \; -print | while read -r file; do
        print_message "Eliminado backup antiguo: $file"
        log "Eliminado backup antiguo: $file"
    done

    print_success "Limpieza completada (retención: $RETENTION_DAYS días)"
}

# Función para mostrar estadísticas
show_stats() {
    print_message "Estadísticas del backup:"

    # Contar backups
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
    echo "  Total de backups: $BACKUP_COUNT"

    # Tamaño total
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    echo "  Espacio total usado: $TOTAL_SIZE"

    # Backup más reciente
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -n "$LATEST_BACKUP" ]; then
        LATEST_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        LATEST_DATE=$(stat -c '%y' "$LATEST_BACKUP" | cut -d'.' -f1)
        echo "  Backup más reciente: $(basename "$LATEST_BACKUP") ($LATEST_SIZE) - $LATEST_DATE"
    fi
}

# Función para enviar notificación (opcional)
send_notification() {
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        print_message "Enviando notificación a Slack..."

        STATUS=$1
        MESSAGE=""

        if [ "$STATUS" = "success" ]; then
            MESSAGE="✅ Backup completado exitosamente\n📁 Archivo: $(basename "$BACKUP_FILE.gz")\n📊 Tamaño: $(du -h "$BACKUP_FILE.gz" | cut -f1)"
        else
            MESSAGE="❌ Error en backup\n📋 Revisa los logs para más detalles"
        fi

        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"$MESSAGE\"}" \
             "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Función principal
main() {
    echo "🗄️ Iniciando backup de Gestión de Eventos"
    echo "========================================"

    # Capturar variables de entorno
    if [ -f ".env.production" ]; then
        export $(grep -v '^#' .env.production | xargs)
    fi

    check_prerequisites
    create_backup_dir

    if perform_backup && verify_backup; then
        cleanup_old_backups
        show_stats
        send_notification "success"

        echo ""
        print_success "🎉 Backup completado exitosamente!"
        echo ""
        print_message "Resumen:"
        echo "  📁 Archivo: $(basename "$BACKUP_FILE.gz")"
        echo "  📊 Tamaño: $(du -h "$BACKUP_FILE.gz" | cut -f1)"
        echo "  📅 Fecha: $(date)"
        echo "  📋 Log: $LOG_FILE"

    else
        send_notification "error"
        print_error "❌ El backup falló. Revisa los logs: $LOG_FILE"
        exit 1
    fi
}

# Función para listar backups
list_backups() {
    print_message "Listando backups disponibles:"

    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "Directorio de backups no existe"
        return
    fi

    printf "%-30s %-10s %-15s\n" "ARCHIVO" "TAMAÑO" "FECHA"
    printf "%-30s %-10s %-15s\n" "------------------------------" "----------" "---------------"

    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -printf '%P\n' 2>/dev/null | sort -r | while read -r file; do
        FILE_PATH="$BACKUP_DIR/$file"
        SIZE=$(du -h "$FILE_PATH" | cut -f1)
        DATE=$(stat -c '%y' "$FILE_PATH" | cut -d' ' -f1)
        printf "%-30s %-10s %-15s\n" "$file" "$SIZE" "$DATE"
    done
}

# Función para restaurar backup
restore_backup() {
    BACKUP_TO_RESTORE=$1

    if [ -z "$BACKUP_TO_RESTORE" ]; then
        print_error "Debes especificar el archivo de backup a restaurar"
        echo "Uso: $0 restore <archivo_backup.sql.gz>"
        exit 1
    fi

    if [ ! -f "$BACKUP_TO_RESTORE" ]; then
        print_error "Archivo de backup no encontrado: $BACKUP_TO_RESTORE"
        exit 1
    fi

    print_warning "⚠️  Esta acción sobrescribirá la base de datos actual"
    read -p "¿Estás seguro de continuar? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        print_message "Restauración cancelada"
        exit 0
    fi

    print_message "Restaurando backup: $BACKUP_TO_RESTORE"

    # Obtener credenciales
    DB_USER=$(grep POSTGRES_USER .env.production | cut -d '=' -f2)
    DB_NAME=$(grep POSTGRES_DB .env.production | cut -d '=' -f2)

    # Descomprimir y restaurar
    gunzip -c "$BACKUP_TO_RESTORE" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$DB_USER" "$DB_NAME"

    if [ $? -eq 0 ]; then
        print_success "Backup restaurado exitosamente"
    else
        print_error "Error al restaurar el backup"
        exit 1
    fi
}

# Manejar argumentos de línea de comandos
case "${1:-}" in
    "list")
        list_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "cleanup")
        cleanup_old_backups
        show_stats
        ;;
    *)
        main
        ;;
esac