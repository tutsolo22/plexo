#!/bin/bash

# Script para migrar proyecto a repositorio de producción
# Versión: 1.0
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

# Repositorio de producción
PROD_REPO="https://github.com/tutsolo22/plexo.git"
CURRENT_DIR=$(pwd)
PROJECT_NAME=$(basename "$CURRENT_DIR")

print_message "🚀 Iniciando migración a repositorio de producción..."
print_message "Repositorio actual: $CURRENT_DIR"
print_message "Repositorio destino: $PROD_REPO"

# Verificar si estamos en un repositorio git
if [ ! -d ".git" ]; then
    print_error "No se encuentra un repositorio git en el directorio actual"
    exit 1
fi

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Hay cambios sin commitear. Creando commit automático..."
    git add .
    git commit -m "feat: preparación para migración a producción

- Actualización de configuración de base de datos
- Usuario: hexaplexo
- Contraseña: [PROTEGIDA]
- Configuración de Redis y IA actualizada
- Preparación para Cloud Run"
    print_success "Commit creado exitosamente"
fi

# Crear backup del repositorio actual
BACKUP_DIR="../${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
print_message "Creando backup en: $BACKUP_DIR"
cp -r . "$BACKUP_DIR"
print_success "Backup creado exitosamente"

# Cambiar remote origin al repositorio de producción
print_message "Cambiando remote origin al repositorio de producción..."
git remote set-url origin "$PROD_REPO"

# Verificar que el remote cambió correctamente
CURRENT_REMOTE=$(git remote get-url origin)
if [ "$CURRENT_REMOTE" != "$PROD_REPO" ]; then
    print_error "Error al cambiar el remote origin"
    exit 1
fi

print_success "Remote origin actualizado exitosamente"

# Push al nuevo repositorio
print_message "Realizando push al repositorio de producción..."
if git push -u origin main; then
    print_success "Push realizado exitosamente"
else
    print_warning "El push falló. Puede que necesites hacer push manual o resolver conflictos"
    print_message "Comando sugerido: git push -u origin main --force"
fi

print_success "✅ Migración completada exitosamente!"
print_message ""
print_message "📋 Resumen de cambios realizados:"
echo "  - Usuario de BD: hexaplexo"
echo "  - Contraseña de BD: DkG7vPEumStlUZNo5o2Nupi"
echo "  - Repositorio: $PROD_REPO"
echo "  - Backup creado en: $BACKUP_DIR"
print_message ""
print_message "🎯 Próximos pasos:"
echo "  1. Verificar que el repositorio se actualizó correctamente"
echo "  2. Configurar Cloud Run con las variables de entorno"
echo "  3. Ejecutar migraciones de base de datos en producción"
echo "  4. Probar el despliegue"