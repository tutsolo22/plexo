#!/bin/bash

set -e

PROJECT_ID="plexo-475822"
JOB_NAME="gestion-eventos-migrate"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${JOB_NAME}:latest"

echo "Building migration image..."
gcloud builds submit \
  --dockerfile=Dockerfile.migrations \
  --tag="${IMAGE_NAME}" \
  --project="${PROJECT_ID}"

echo "Creating/updating Cloud Run job..."
gcloud run jobs create "${JOB_NAME}" \
  --image="${IMAGE_NAME}" \
  --region="${REGION}" \
  --set-env-vars DATABASE_URL="postgresql://hexaplexo:DkG7vPEumStlUZNo5o2Nupi%23%24@10.34.144.3:5432/gestion_eventos_prod" \
  --memory=2Gi \
  --cpu=2 \
  --task-timeout=3600s \
  --project="${PROJECT_ID}" \
  --vpc-connector="projects/${PROJECT_ID}/locations/${REGION}/connectors/plexo-net" \
  2>/dev/null || \
gcloud run jobs update "${JOB_NAME}" \
  --image="${IMAGE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}"

echo "Executing migration job..."
gcloud run jobs execute "${JOB_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --wait

echo "Migration completed!"
