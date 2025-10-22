<#
PowerShell helper to build, push and run Cloud Run Jobs for DB migrate and seed.
Usage examples:
.
# Build and push images then create and execute jobs
.
# Parameters explained below
#>
param(
  [string]$ProjectId = "plexo-475822",
  [string]$Region = "us-central1",
  [string]$ImageName = "gcr.io/plexo-475822/plexo-db-job:latest",
  [string]$CloudSqlInstance = "",
  [string]$DatabaseName = "plexo",
  [switch]$BuildAndPush = $true
)

if ($BuildAndPush) {
  Write-Host "Building image from repo root using docker/db-job/Dockerfile"
  docker build -f docker/db-job/Dockerfile -t $ImageName .
  Write-Host "Pushing image: $ImageName"
  docker push $ImageName
}

# Create migrate job
$jobMigrate = "db-migrate-job"
Write-Host "Creating/updating Cloud Run Job: $jobMigrate"
gcloud run jobs describe $jobMigrate --region $Region --project $ProjectId 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud run jobs create $jobMigrate --image $ImageName --region $Region --project $ProjectId --add-cloudsql-instances $CloudSqlInstance --set-env-vars DATABASE_NAME=$DatabaseName
} else {
  gcloud run jobs update $jobMigrate --image $ImageName --region $Region --project $ProjectId --add-cloudsql-instances $CloudSqlInstance --set-env-vars DATABASE_NAME=$DatabaseName
}

# Execute migrate job
Write-Host "Executing job: $jobMigrate"
gcloud run jobs execute $jobMigrate --region $Region --project $ProjectId --task-command migrate --max-retries 0 --service-account=default

# Create seed job
$jobSeed = "db-seed-job"
Write-Host "Creating/updating Cloud Run Job: $jobSeed"
gcloud run jobs describe $jobSeed --region $Region --project $ProjectId 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud run jobs create $jobSeed --image $ImageName --region $Region --project $ProjectId --add-cloudsql-instances $CloudSqlInstance --set-env-vars DATABASE_NAME=$DatabaseName
} else {
  gcloud run jobs update $jobSeed --image $ImageName --region $Region --project $ProjectId --add-cloudsql-instances $CloudSqlInstance --set-env-vars DATABASE_NAME=$DatabaseName
}

Write-Host "Seed job created/updated. Execute it manually when you want to run seeds:"
Write-Host "gcloud run jobs execute $jobSeed --region $Region --project $ProjectId --task-command seed"
