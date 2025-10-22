DB Jobs (migrations + seeds) — instrucciones rápidas

Resumen
- Hemos preparado un contenedor reutilizable en `docker/db-job` que puede ejecutar migraciones y seeds.
- Añadimos `postinstall` en `package.json` para que Buildpacks ejecute `prisma generate` durante el build de la aplicación.

Flujo recomendado
1. Desplegar migraciones (una vez, antes de la app):
   - Construir y subir la imagen
     ```powershell
     .\scripts\deploy-db-jobs.ps1 -ProjectId YOUR_PROJECT -Region YOUR_REGION -CloudSqlInstance YOUR_INSTANCE -ImageName gcr.io/YOUR_PROJECT/plexo-db-job:latest -BuildAndPush
     ```
   - Ejecutar el job de migraciones (ya creado por el script):
     ```powershell
     gcloud run jobs execute db-migrate-job --region YOUR_REGION --project YOUR_PROJECT --task-command migrate
     ```

2. Ejecutar seeds (manual; idempotente recomendado):
   - Ejecuta el job de seeds cuando lo necesites:
     ```powershell
     gcloud run jobs execute db-seed-job --region YOUR_REGION --project YOUR_PROJECT --task-command seed
     ```

Notas
- Asegúrate de almacenar credenciales sensibles en Secret Manager y pasar los valores por variables de entorno o usar una cuenta de servicio con permisos limitados.
- El script `docker/db-job/entrypoint.sh` arma `DATABASE_URL` automáticamente si se provee `CLOUDSQL_CONNECTION_NAME` y `DB_USER`/`DB_PASS`/`DB_NAME`.
- El `postinstall` en `package.json` ejecuta `prisma generate` durante el proceso de Buildpacks para que tu imagen de Cloud Run tenga el cliente Prisma disponible.
