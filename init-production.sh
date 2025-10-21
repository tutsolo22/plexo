#!/bin/bash

# Script de Inicialización para Producción
# Gestión de Eventos v3.0

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js no está instalado"
        exit 1
    fi

    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm no está instalado"
        exit 1
    fi

    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker no está instalado"
        exit 1
    fi

    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "Docker Compose no está instalado"
        exit 1
    fi

    print_success "Prerrequisitos verificados"
}

# Instalar dependencias
install_dependencies() {
    print_message "Instalando dependencias de producción..."

    npm ci --only=production --ignore-scripts

    print_success "Dependencias instaladas"
}

# Configurar base de datos
setup_database() {
    print_message "Configurando base de datos..."

    # Generar Prisma client
    npx prisma generate

    # Crear base de datos si no existe
    if [ -n "$DATABASE_URL" ]; then
        print_message "Aplicando esquema de base de datos..."
        npx prisma db push --force-reset
    else
        print_warning "DATABASE_URL no configurada, saltando configuración de BD"
    fi

    print_success "Base de datos configurada"
}

# Ejecutar seed
run_seed() {
    print_message "Ejecutando seed de datos..."

    npm run db:seed

    print_success "Seed ejecutado"
}

# Verificar configuración
verify_setup() {
    print_message "Verificando configuración..."

    # Verificar que el build funciona
    npm run build

    print_success "Configuración verificada"
}

# Función principal
main() {
    echo "🚀 Inicialización de Producción - Gestión de Eventos v3.0"
    echo "======================================================"

    check_prerequisites
    install_dependencies
    setup_database
    run_seed
    verify_setup

    echo ""
    print_success "🎉 Inicialización completada exitosamente!"
    echo ""
    echo "Para iniciar la aplicación:"
    echo "  npm start"
    echo ""
    echo "O usando Docker:"
    echo "  docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    print_message "Credenciales de administrador:"
    print_message "  Email: soporteapps@hexalux.mx"
    print_message "  Password: Password123"
}

# Manejar argumentos
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos:"
        echo "  (sin argumentos) - Inicialización completa"
        echo "  deps             - Solo instalar dependencias"
        echo "  db               - Solo configurar base de datos"
        echo "  seed             - Solo ejecutar seed"
        echo "  verify           - Solo verificar configuración"
        echo "  help             - Mostrar esta ayuda"
        ;;
    "deps")
        check_prerequisites
        install_dependencies
        ;;
    "db")
        check_prerequisites
        setup_database
        ;;
    "seed")
        run_seed
        ;;
    "verify")
        verify_setup
        ;;
    *)
        main
        ;;
esac