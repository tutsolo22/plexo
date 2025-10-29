Inicialización de la base de datos y seed para Plexo
===============================================

Este documento explica cómo inicializar una base de datos PostgreSQL nueva con el schema consolidado
y ejecutar el seed incluido en `prisma/seed.ts`.

Resumen de opciones
- Opción A (recomendada): Crear una instancia Cloud SQL (Postgres) y ejecutar el SQL consolidado + migraciones con `psql` o `prisma migrate deploy`.
- Opción B: Usar `npx prisma migrate deploy` contra la base de datos si prefieres usar las migraciones en carpeta.

Antes de empezar
- Asegúrate de tener `gcloud` (si usas Cloud SQL), `psql` y `node`/`npm` instalados.
- Habilita las APIs: run.googleapis.com, sqladmin.googleapis.com, artifactregistry.googleapis.com (opcional), containerregistry.googleapis.com (si usas GCR).
- Configura `DATABASE_URL` (ejemplo para Cloud SQL Unix socket):

  postgres://USER:PASSWORD@/DBNAME?host=/cloudsql/PROJECT:REGION:INSTANCE

Pasos - Opción A: Cloud SQL + aplicar SQL consolidado
1) Crear instancia Cloud SQL (Postgres) desde GCP Console o gcloud. Ejemplo con gcloud:

```powershell
# Reemplaza valores
$PROJECT = "tu-project-id"
$INSTANCE = "plexo-prod-db"
$REGION = "us-central1"

gcloud config set project $PROJECT;
gcloud sql instances create $INSTANCE --database-version=POSTGRES_15 --region=$REGION --tier=db-f1-micro

# Crear base de datos y usuario
gcloud sql databases create gestion_eventos_prod --instance=$INSTANCE
gcloud sql users create plexo_user --instance=$INSTANCE --password="StrongPasswordHere"
```

2) Conectar y aplicar el SQL consolidado (opcional). Puedes usar Cloud Shell o conectar con psql.

```powershell
# Obtener conexión (ejemplo con Cloud Shell):
# gcloud sql connect $INSTANCE --user=plexo_user --quiet

# O si tienes psql configurado, descargar el archivo y ejecutar:
psql "hostaddr=<INSTANCE_IP> user=plexo_user password=StrongPasswordHere dbname=gestion_eventos_prod sslmode=require" -f prisma/migrations/20251022_initial_schema/migration.sql
```

3) (Recomendado) Ejecutar Prisma generate y migraciones desde el proyecto:

```powershell
npm ci --omit=dev
npx prisma generate

# Si usas migraciones en carpeta (recomendado si quieres aplicar paso a paso):
npx prisma migrate deploy --preview-feature

# O si ya aplicaste migration.sql manualmente, marca las migraciones como aplicadas:
npx prisma migrate resolve --applied 20251022_initial_schema
```

4) Ejecutar seed

```powershell
# Ejecutar seed con tsx (devDependency presente)
npx tsx prisma/seed.ts
```

Pasos - Opción B: Usar `prisma migrate deploy` desde el proyecto (sin aplicar manualmente SQL)
1) Asegúrate de `DATABASE_URL` apuntando a la base de datos.
2) Ejecuta:

```powershell
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts
```

Notas y recomendaciones
- No publiques secret keys ni `DATABASE_URL` en el repo.
- Para Cloud Run: crea los secretos en Secret Manager y referencia las variables en Cloud Run.
- Si usas Cloud SQL con Cloud Run: configura la conexión agregando la opción `--add-cloudsql-instances=PROJECT:REGION:INSTANCE` al desplegar con `gcloud run deploy` o configura la variable `DB_SOCKET_PATH=/cloudsql` y usa el connection name en `DATABASE_URL`.
- Si necesitas ejecutar migraciones en el contenedor en Cloud Run, considera ejecutar `npx prisma migrate deploy` en el startup command o usar Cloud Build/Cloud Run Job para aplicar migraciones antes del tráfico de producción.

Contacto
- Si quieres, puedo generar un script PowerShell que: cree secretos en Secret Manager desde tu `.env.production`, cree la instancia Cloud SQL (opcional) y haga el deploy a Cloud Run con las opciones correctas.
