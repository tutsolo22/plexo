# Upload a SQL file to GCS and import into Cloud SQL Postgres.
# Usage example:
# .\import-sql-cloudsql.ps1 -ProjectId plexo-475822 -Bucket plexo-sql-dumps -Instance mats-hexaplexo -Database plexo -SqlFile .\prisma\migrations\20251022_full_schema\migration.sql -TransformEnums

param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [Parameter(Mandatory=$true)][string]$Bucket,
  [Parameter(Mandatory=$true)][string]$Instance,
  [Parameter(Mandatory=$true)][string]$Database,
  [Parameter(Mandatory=$true)][string]$SqlFile,
  [switch]$TransformEnums
)

function Transform-EnumsInSqlFile {
  param(
    [string]$InputPath,
    [string]$OutputPath
  )

  Write-Host "Transforming enum CREATE TYPE statements for compatibility..."
  $content = Get-Content -Raw -LiteralPath $InputPath

  # Regex: match CREATE TYPE IF NOT EXISTS "TypeName" AS ENUM ( 'a', 'b' );
  $pattern = '(?is)CREATE\s+TYPE\s+IF\s+NOT\s+EXISTS\s+"(?<name>[^"]+)"\s+AS\s+ENUM\s*\((?<vals>[^;]+?)\)\s*;'

  $newContent = [regex]::Replace($content, $pattern, {
    param($m)
    $typeName = $m.Groups['name'].Value
    $vals = $m.Groups['vals'].Value.Trim()
    # convert type name to lowercase and replace non-word with _ (simple normalization)
    $pgType = $typeName.ToLower() -replace '[^a-z0-9_]', '_'

    $block = "DO $$ BEGIN`n  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '$pgType') THEN`n    CREATE TYPE $pgType AS ENUM ($vals);`n  END IF;`nEND $$;"
    return $block
  })

  Set-Content -LiteralPath $OutputPath -Value $newContent -Encoding UTF8
  Write-Host "Transformed SQL written to: $OutputPath"
}

try {
  if (-not (Test-Path $SqlFile)) {
    throw "SQL file not found: $SqlFile"
  }

  $baseName = [System.IO.Path]::GetFileName($SqlFile)
  $uploadPath = "gs://$Bucket/$baseName"

  $fileToUpload = $SqlFile
  if ($TransformEnums) {
    $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.IO.Path]::GetFileNameWithoutExtension($baseName) + '.pg.sql')
    Transform-EnumsInSqlFile -InputPath $SqlFile -OutputPath $tmp
    $fileToUpload = $tmp
    $baseName = [System.IO.Path]::GetFileName($fileToUpload)
    $uploadPath = "gs://$Bucket/$baseName"
  }

  Write-Host "Uploading $fileToUpload to $uploadPath (project: $ProjectId)"
  & gsutil cp $fileToUpload $uploadPath
  if ($LASTEXITCODE -ne 0) { throw "gsutil cp failed" }

  Write-Host "Starting Cloud SQL import: instance=$Instance, database=$Database"
  & gcloud sql import sql $Instance $uploadPath --database=$Database --project=$ProjectId --quiet
  if ($LASTEXITCODE -ne 0) { throw "gcloud sql import sql failed" }

  Write-Host "Import started successfully. Monitor operation in Cloud Console or via 'gcloud sql operations list --instance=$Instance --project=$ProjectId'"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
