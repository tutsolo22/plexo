# Cloud Run Job para Migraciones de Prisma

Este documento explica cómo ejecutar migraciones de base de datos en Google
Cloud Run usando un Job.

## Estructura

- `scripts/run-migrations.sh` - Script que ejecuta las migraciones
- `Dockerfile.migrations` - Dockerfile específico para el job de migraciones
- `scripts/deploy-migrations-job.sh` - Script que crea/actualiza el job en Cloud
  Run

## Uso

### Opción 1: Ejecutar el script de deploy (Recomendado)

```bash
chmod +x scripts/deploy-migrations-job.sh
./scripts/deploy-migrations-job.sh
```

Este script:

1. Construye la imagen Docker para migraciones
2. Crea o actualiza el Cloud Run Job
3. Ejecuta el job inmediatamente
4. Espera a que termine

### Opción 2: Ejecutar manualmente con gcloud

```bash
# Ejecutar job existente
gcloud run jobs execute gestion-eventos-migrate \
  --region=us-central1 \
  --project=plexo-475822 \
  --wait
```

### Opción 3: Ejecutar en local para pruebas

```bash
# Configurar variables de entorno
export DATABASE_URL="postgresql://hexaplexo:DkG7vPEumStlUZNo5o2Nupi%23%24@10.34.144.3:5432/gestion_eventos_prod"

# Ejecutar el script
./scripts/run-migrations.sh
```

## Flujo de trabajo recomendado

1. **Crear nueva migración** en local:

   ```bash
   npx prisma migrate dev --name nombre_migracion
   ```

2. **Comitear los cambios**:

   ```bash
   git add prisma/migrations/
   git commit -m "feat: Nueva migración - nombre_migracion"
   git push
   ```

3. **Ejecutar migraciones en Cloud Run**:

   ```bash
   ./scripts/deploy-migrations-job.sh
   ```

4. **Verificar resultado**:
   ```bash
   gcloud run jobs describe gestion-eventos-migrate \
     --region=us-central1 \
     --project=plexo-475822
   ```

## Seguridad

- El job usa VPC connector para conectarse de forma privada a Cloud SQL
- DATABASE_URL está configurada en el job
- El contenedor es efímero (se elimina después de ejecutarse)

## Troubleshooting

### Ver logs del último job ejecutado

```bash
gcloud run jobs logs read gestion-eventos-migrate \
  --region=us-central1 \
  --project=plexo-475822 \
  --limit=100
```

### Si la migración falla

1. Revisa los logs para el error específico
2. Asegúrate que DATABASE_URL está correcta
3. Verifica que el VPC connector tiene acceso a Cloud SQL
4. Intenta ejecutar localmente primero: `npx prisma migrate deploy`

## Variables de entorno necesarias

- `DATABASE_URL` - URL de conexión a PostgreSQL (ya configurada en el job)

## Notas

- El job no se elimina automáticamente después de ejecutarse (para poder ver
  histórico)
- Para eliminar el job:
  `gcloud run jobs delete gestion-eventos-migrate --region=us-central1`
- Las migraciones son idempotentes (ejecutarlas múltiples veces es seguro)
