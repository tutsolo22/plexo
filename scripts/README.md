# Scripts de Base de Datos - Gestión de Eventos

Este directorio contiene scripts específicos para la configuración y
mantenimiento de la base de datos PostgreSQL.

## Archivos disponibles

### `enable-pgvector.pgsql`

**Propósito**: Habilita la extensión pgvector en PostgreSQL para soporte de
vectores de IA.

**Requisitos previos**:

- PostgreSQL 12+ instalado
- Extensión pgvector disponible en el sistema
- Permisos de superusuario en la base de datos

**Uso**:

```bash
# Conectar a PostgreSQL y ejecutar el script
psql -d gestion_eventos -f scripts/enable-pgvector.pgsql

# O ejecutar línea por línea en psql
psql -d gestion_eventos
\i scripts/enable-pgvector.pgsql
```

**Verificación**: Después de ejecutar el script, puedes verificar que la
extensión está instalada:

```sql
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

### `demo-data.ts`

Script de TypeScript para generar datos de demostración en el sistema.

## Configuración de la Base de Datos

### Conexión PostgreSQL

```bash
# Variables de entorno recomendadas
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/gestion_eventos"
POSTGRES_USER="gestion_eventos_user"
POSTGRES_PASSWORD="tu_contraseña_segura"
POSTGRES_DB="gestion_eventos"
```

### Instalación de pgvector

Si la extensión pgvector no está disponible, instálala primero:

**Ubuntu/Debian**:

```bash
sudo apt install postgresql-15-pgvector
```

**macOS** (con Homebrew):

```bash
brew install pgvector
```

**Windows**:

- Descargar desde: https://github.com/pgvector/pgvector/releases
- Seguir las instrucciones de instalación para Windows

## Notas importantes

1. **Archivo .pgsql**: Estos archivos son específicos para PostgreSQL y no deben
   ejecutarse en otros sistemas de base de datos como SQL Server o MySQL.

2. **Permisos**: Los scripts que crean extensiones requieren permisos de
   superusuario.

3. **Entorno de desarrollo**: Asegúrate de que Docker Compose esté configurado
   correctamente si usas contenedores.

## Solución de problemas

### Error: "extension does not exist"

```sql
-- Verificar extensiones disponibles
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- Si no está disponible, instalar pgvector en el sistema
```

### Error de permisos

```sql
-- Otorgar permisos de superusuario temporalmente
ALTER USER tu_usuario SUPERUSER;
-- Ejecutar el script
-- Remover permisos de superusuario
ALTER USER tu_usuario NOSUPERUSER;
```
