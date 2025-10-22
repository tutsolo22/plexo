<#
  create-secrets.ps1
  Lee un archivo .env y crea secretos en Secret Manager (gcloud).

  Uso (ejemplo):
    .\scripts\create-secrets.ps1 -ProjectId your-gcp-project -EnvFile .env.production

  Nota: Este script lee valores sensibles desde tu filesystem y los sube a
  Secret Manager. No comparte valores. Ejecútalo en tu máquina local.
#>

param(
  [Parameter(Mandatory=$true)] [string]$ProjectId,
  [Parameter(Mandatory=$false)] [string]$EnvFile = ".env.production"
)

function Check-Command($name) {
  $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Check-Command gcloud)) {
  Write-Error "gcloud no está instalado o no está en PATH. Instala Google Cloud SDK antes de continuar."
  exit 1
}

if (-not (Test-Path $EnvFile)) {
  Write-Error "Archivo de entorno no encontrado: $EnvFile"
  exit 1
}

Write-Host "Creando/actualizando secretos en Secret Manager para proyecto: $ProjectId"

# Leer .env (ignorando comentarios y líneas vacías)
$lines = Get-Content $EnvFile | Where-Object { $_ -and ($_ -match '\S') -and ($_ -notmatch '^\s*#') }

foreach ($line in $lines) {
  $trim = $line.Trim()
  if ($trim -match '^(?<k>[^=]+)=(?<v>.*)$') {
    $key = $matches['k'].Trim()
    $value = $matches['v']

    # Evitar secrets vacíos
    if ([string]::IsNullOrEmpty($value)) {
      Write-Host "Skipping empty value for $key"
      continue
    }

    Write-Host "-> Procesando secreto: $key"

    # Comprobar si existe el secreto
    $exists = & gcloud secrets describe $key --project $ProjectId 2>$null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "   Creando secreto: $key"
      # Crear secreto y añadir versión leyendo desde stdin
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)
      $tmp = [System.IO.Path]::GetTempFileName()
      [System.IO.File]::WriteAllBytes($tmp, $bytes)
      & gcloud secrets create $key --project $ProjectId --replication-policy="automatic" --data-file=$tmp | Out-Null
      Remove-Item $tmp -Force
    } else {
      Write-Host "   Agregando nueva versión a: $key"
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)
      $tmp = [System.IO.Path]::GetTempFileName()
      [System.IO.File]::WriteAllBytes($tmp, $bytes)
      & gcloud secrets versions add $key --project $ProjectId --data-file=$tmp | Out-Null
      Remove-Item $tmp -Force
    }
  }
}

Write-Host "Se han creado/actualizado los secretos."
