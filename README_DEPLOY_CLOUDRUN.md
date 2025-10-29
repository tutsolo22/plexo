Despliegue a Google Cloud Run - Plexo
===================================

Este repo incluye scripts para preparar secretos, construir la imagen y desplegar a Cloud Run.

Archivos importantes
- `scripts\create-secrets.ps1` - crea secretos en Secret Manager a partir de un `.env` local.
- `scripts\deploy-cloudrun.ps1` - construye la imagen, la sube a Artifact Registry y despliega a Cloud Run (PowerShell).
- `prisma\migrations\20251022_initial_schema\migration.sql` - migración consolidada (baseline) para bases nuevas.
- `prisma\seed.ts` - seed inicial para producción.

Checklist mínimo antes de desplegar
1) Autenticarte en gcloud: `gcloud auth login` y `gcloud config set project YOUR_PROJECT`
2) Ejecutar: `.\scripts\create-secrets.ps1 -ProjectId YOUR_PROJECT -EnvFile .env.production` para subir secretos.
3) Ejecutar: `.\scripts\deploy-cloudrun.ps1 -ProjectId YOUR_PROJECT -ServiceName plexo-gestion-eventos -Region us-central1 -ImageRepo plexo-repo -CloudSqlInstance PROJECT:REGION:INSTANCE`
4) Inicializar DB (usar `prisma/README_INIT_DB.md`) y correr seed: `npx tsx prisma/seed.ts`

Comandos útiles
```powershell
# Crear secretos desde .env.production
.\scripts\create-secrets.ps1 -ProjectId your-project -EnvFile .env.production

# Desplegar (con Cloud SQL connection name)
.\scripts\deploy-cloudrun.ps1 -ProjectId your-project -ServiceName plexo-gestion-eventos -Region us-central1 -ImageRepo plexo-repo -CloudSqlInstance your-project:us-central1:instance-name

# Ver logs
gcloud logs read --project=your-project --limit=100 --format="table(timestamp, textPayload)"

# Obtener URL
gcloud run services describe plexo-gestion-eventos --region us-central1 --format='value(status.url)'
```

Soporte y siguientes pasos
- Si quieres, puedo ajustar `deploy-cloudrun.ps1` para usar GCR en lugar de Artifact Registry, o para incluir pasos de migración automática antes de recibir tráfico.
- También puedo generar un pipeline de GitHub Actions que construya la imagen y la despliegue automáticamente cuando merges a `main`.
