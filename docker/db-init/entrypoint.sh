#!/usr/bin/env bash
set -euo pipefail

echo "DB init container starting..."

SQL_FILE=${SQL_FILE:-/workspace/prisma/migrations/20251022_full_schema/migration.sql}
APPLY_SQL=${APPLY_SQL:-true}
TRANSFORM_ENUMS=${TRANSFORM_ENUMS:-true}

# Determine DATABASE_URL: prefer provided DATABASE_URL; else, build from Cloud SQL socket vars
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${CLOUDSQL_CONNECTION_NAME:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASS:-}" ] && [ -n "${DB_NAME:-}" ]; then
    echo "DATABASE_URL not provided, building from Cloud SQL socket info"
    # Use libpq socket connection via host=/cloudsql/<INSTANCE>
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${CLOUDSQL_CONNECTION_NAME}"
    export DATABASE_URL
  else
    echo "ERROR: Either DATABASE_URL or (CLOUDSQL_CONNECTION_NAME + DB_USER + DB_PASS + DB_NAME) must be set. Exiting."
    exit 2
  fi
fi

function transform_enums() {
  # Simple sed-based transform: replace CREATE TYPE IF NOT EXISTS "Name" AS ENUM (...) ;
  # with a DO $$ BEGIN IF NOT EXISTS (...) THEN CREATE TYPE name AS ENUM (...); END IF; END $$;
  local in_file=$1
  local out_file=$2
  echo "Transforming ENUMs in $in_file -> $out_file"

  # This is a conservative transformation; for complex cases manual review may be needed.
  perl -0777 -pe "s/CREATE\s+TYPE\s+IF\s+NOT\s+EXISTS\s+\"([^\"]+)\"\s+AS\s+ENUM\s*\(([^;]+?)\)\s*;/DO \\$\$ BEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lc_\l\1') THEN\n    CREATE TYPE lc_\l\1 AS ENUM (\2);\n  END IF;\nEND \\$\$;/isg" "$in_file" > "$out_file"
}

TMP_SQL="/tmp/migration_ready.sql"

if [ "$APPLY_SQL" = "true" ]; then
  if [ ! -f "$SQL_FILE" ]; then
    echo "SQL file not found: $SQL_FILE"
    exit 3
  fi

  if [ "$TRANSFORM_ENUMS" = "true" ]; then
    transform_enums "$SQL_FILE" "$TMP_SQL"
    psql "$DATABASE_URL" -f "$TMP_SQL"
  else
    psql "$DATABASE_URL" -f "$SQL_FILE"
  fi
else
  echo "APPLY_SQL is false -> running prisma migrate deploy"
  npx prisma migrate deploy --schema=./prisma/schema.prisma
fi

echo "Running seed script (npx prisma db seed)"
# Some projects use prisma db seed, others expose a seed script; try both
if npx prisma db seed --schema=./prisma/schema.prisma; then
  echo "Seed executed via prisma db seed"
else
  echo "Falling back to direct seed execution: node prisma/seed.ts"
  node prisma/seed.ts
fi

echo "DB init finished successfully"
