<#
  deploy-cloudrun.ps1
  Construye la imagen Docker, la sube a Artifact Registry (o GCR) y despliega a Cloud Run.

  Uso:
    .\scripts\deploy-cloudrun.ps1 -ProjectId your-project -ServiceName plexo-gestion-eventos -Region us-central1 -ImageRepo plexo-repo -CloudSqlInstance plexo-475822:us-central1:mats-hexaplexo

  Requisitos:
  - gcloud instalado y autenticado
  - Docker instalado
  - Haber ejecutado create-secrets.ps1 previamente para subir secretos a Secret Manager
#>

param(
  [Parameter(Mandatory=$true)] [string]$ProjectId,
  [Parameter(Mandatory=$false)] [string]$ServiceName = "plexo-gestion-eventos",
  [Parameter(Mandatory=$false)] [string]$Region = "us-central1",
  [Parameter(Mandatory=$false)] [string]$ImageRepo = "plexo-gestion-eventos",
  [Parameter(Mandatory=$false)] [string]$CloudSqlInstance = ""
)

function Check-Command($name) {
  $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Check-Command gcloud)) { Write-Error "gcloud no está instalado"; exit 1 }
if (-not (Check-Command docker)) { Write-Error "docker no está instalado"; exit 1 }

gcloud config set project $ProjectId | Out-Null

# Decide si usar Artifact Registry (recomendado) o GCR
$useArtifact = $true

if ($useArtifact) {
  $repoLocation = "$Region"
  $repoName = $ImageRepo
  # Use repoLocation (region) when building Artifact Registry image URI
  $imageUri = "$repoLocation-docker.pkg.dev/$ProjectId/$repoName/$ServiceName:latest"

  # Crear repositorio si no existe
  $exists = & gcloud artifacts repositories describe $repoName --location=$repoLocation --project=$ProjectId 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Creando Artifact Registry: $repoName en $repoLocation"
    gcloud artifacts repositories create $repoName --repository-format=docker --location=$repoLocation --project=$ProjectId | Out-Null
  }

  # Build
  docker build -f Dockerfile.cloudrun -t $imageUri .

  # Auth docker
  gcloud auth configure-docker $repoLocation-docker.pkg.dev --project $ProjectId --quiet | Out-Null
  docker push $imageUri
} else {
  $imageUri = "gcr.io/$ProjectId/$ServiceName:latest"
  docker build -f Dockerfile.cloudrun -t $imageUri .
  gcloud auth configure-docker --quiet | Out-Null
  docker push $imageUri
}

Write-Host "Imagen subida: $imageUri"

# Preparar variables de entorno y secretos (lista de nombres de secretos que creaste)
$envSecrets = @(
  'DATABASE_URL','NEXTAUTH_SECRET','NEXTAUTH_URL','SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','GOOGLE_API_KEY','JWT_SECRET'
)

# Construir la cadena --set-secrets para gcloud
$secretArgs = @()
foreach ($s in $envSecrets) {
  # Asumir que el secreto existe con el mismo nombre
  $secretArgs += "--set-secrets $s=projects/$ProjectId/secrets/$s:latest"
}

# Añadir Cloud SQL instances si se proporcionó
$cloudSqlArg = ""
if ($CloudSqlInstance -ne "") {
  $cloudSqlArg = "--add-cloudsql-instances=$CloudSqlInstance"
}

Write-Host "Desplegando en Cloud Run..."
gcloud run deploy $ServiceName `
  --image $imageUri `
  --project $ProjectId `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 1Gi `
  --cpu 1 `
  --concurrency 80 `
  --timeout 300 `
  $cloudSqlArg `
  $secretArgs -join ' '

Write-Host "Despliegue finalizado. Obtén la URL con: gcloud run services describe $ServiceName --region $Region --format='value(status.url)'"
