#!/usr/bin/env bash
set -euo pipefail

COMMAND=${1:-migrate}

# Ensure DATABASE_URL is set or Cloud SQL socket variables exist
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${CLOUDSQL_CONNECTION_NAME:-}" ]; then
    if [ -z "${DB_USER:-}" ] || [ -z "${DB_PASS:-}" ] || [ -z "${DB_NAME:-}" ]; then
      echo "Missing DB_USER/DB_PASS/DB_NAME for Cloud SQL socket connection" >&2
      exit 1
    fi
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@/$(echo ${DB_NAME})?host=/cloudsql/${CLOUDSQL_CONNECTION_NAME}"
  else
    echo "DATABASE_URL not provided and no CLOUDSQL_CONNECTION_NAME specified" >&2
    exit 1
  fi
fi

case "$COMMAND" in
  migrate)
    echo "Running: prisma migrate deploy"
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    ;;
  seed)
    echo "Running: prisma db seed"
    # Use the configured prisma seed command in package.json
    npm run db:seed
    ;;
  *)
    echo "Unknown command: $COMMAND" >&2
    exit 2
    ;;
esac

# keep exit code
exit 0
