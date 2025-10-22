param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [string]$ImageName = "incio_db:latest",
  [Parameter(Mandatory=$true)][string]$Region,
  [Parameter(Mandatory=$true)][string]$CloudSqlInstance, # format: project:region:instance
  [Parameter(Mandatory=$true)][string]$DatabaseName,
  [Parameter(Mandatory=$true)][string]$GcsBucket
)

Write-Host "Building Docker image: $ImageName (using Dockerfile in docker/db-init with repo root as context)"
# Build using the repo root as context so Docker COPY can access files in the project root
docker build -f docker/db-init/Dockerfile -t $ImageName .

Write-Host "Pushing to Artifact Registry (or Docker hub). Ensure repository exists and you are authenticated."
docker push $ImageName

Write-Host "Creating Cloud Run Job 'db-init-job' in project $ProjectId (region $Region)"
try {
  gcloud run jobs create db-init-job --image $ImageName --region $Region --project $ProjectId --format=json | Out-Null
} catch {
  Write-Host "Job may already exist or creation failed; continuing: $_"
}

Write-Host "Setting Cloud SQL instance for job"
# NOTE: For secrets (DB user/pass) prefer using Secret Manager and referencing them via --set-secrets.
gcloud run jobs update db-init-job --region $Region --project $ProjectId \
  --add-cloudsql-instances=$CloudSqlInstance \
  --set-env-vars=APPLY_SQL=true,TRANSFORM_ENUMS=true,DATABASE_NAME=$DatabaseName,GCS_BUCKET=$GcsBucket,CLOUDSQL_CONNECTION_NAME=$CloudSqlInstance \
  --task-timeout=1800s

Write-Host "Executing Cloud Run Job (db-init-job)"
gcloud run jobs execute db-init-job --region $Region --project $ProjectId --wait

Write-Host "Job executed. Check logs with: gcloud logs read --project=$ProjectId --limit=100 --freshness=1h"
