# DB init Docker image

This folder contains a small Docker image and entrypoint used to initialize a fresh Postgres database
for the Plexo project and then run the Prisma seed script.

Files
- `Dockerfile` - node:20-bullseye-slim image, installs `psql` and project deps.
- `entrypoint.sh` - applies the consolidated SQL or runs `prisma migrate deploy` and then runs the seed.

Usage (build locally)

```powershell
# Build
docker build -t plexo/db-init:latest docker/db-init

# Run locally (example using a local Postgres or Cloud SQL Auth Proxy). You must provide DATABASE_URL
docker run --rm -e DATABASE_URL="postgresql://user:pass@host:5432/plexo" plexo/db-init:latest
```

Recommended Cloud Run Job steps
1. Build and push image to Artifact Registry.
2. Create a Cloud Run Job that attaches the Cloud SQL instance with `--add-cloudsql-instances=PROJECT:REGION:INSTANCE`.
3. Provide `DATABASE_URL` via Secret Manager or let Cloud Run mount the connection via the built-in Cloud SQL connector (then use psql inside the container pointing to localhost:5432).
4. Execute the job.

Environment variables recognized by `entrypoint.sh`:
- `DATABASE_URL` (required)
- `APPLY_SQL` (default: true) — if true uses the consolidated SQL file; if false runs `npx prisma migrate deploy`.
- `SQL_FILE` (default: /workspace/prisma/migrations/20251022_full_schema/migration.sql)
- `TRANSFORM_ENUMS` (default: true) — if true attempts to convert CREATE TYPE statements to safe DO $$ blocks.
