# Backup PostgreSQL (WorkaPool) -> pasta sincronizada com Google Drive
# Requer: pg_dump no PATH (instalacao do PostgreSQL)
#
# Uso manual:
#   powershell -ExecutionPolicy Bypass -File backup-database.ps1
#   ou duplo clique em backup-database.bat
#
# Agendar (Agendador de Tarefas): acao = backup-database.bat, diario ex. 02:00

param(
    [string]$ConfigFile = "$PSScriptRoot\backup.config"
)

$ErrorActionPreference = "Stop"

# --- Config padrao (sobrescrita por backup.config) ---
$BackupDir = Join-Path $env:USERPROFILE "Google Drive\Backups\WorkaPool"
$KeepDays = 14
$EnvFile = Join-Path $PSScriptRoot "..\backend\.env.production"

if (Test-Path $ConfigFile) {
    Get-Content $ConfigFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        if ($line -match "^BACKUP_DIR=(.+)$") {
            $BackupDir = $matches[1].Trim().Replace("%USERPROFILE%", $env:USERPROFILE)
        }
        if ($line -match "^KEEP_DAYS=(\d+)$") {
            $KeepDays = [int]$matches[1]
        }
        if ($line -match "^ENV_FILE=(.+)$") {
            $EnvFile = $matches[1].Trim().Replace("%USERPROFILE%", $env:USERPROFILE)
        }
    }
}

$EnvFile = [System.IO.Path]::GetFullPath($EnvFile)
$BackupDir = [System.IO.Path]::GetFullPath($BackupDir)

if (-not (Test-Path $EnvFile)) {
    throw "Arquivo de ambiente nao encontrado: $EnvFile"
}

$databaseUrl = $null
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL\s*=\s*(.+)\s*$') {
        $databaseUrl = $matches[1].Trim().Trim('"').Trim("'")
    }
}

if (-not $databaseUrl) {
    throw "DATABASE_URL nao encontrado em $EnvFile"
}

if ($databaseUrl -notmatch '^postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)') {
    throw "DATABASE_URL em formato invalido para backup automatico."
}

$pgUser = $matches[1]
$pgPass = $matches[2]
$pgHost = $matches[3]
$pgPort = $matches[4]
$pgDb   = $matches[5]

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    $candidates = @(
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { $pgDump = Get-Command $path; break }
    }
}
if (-not $pgDump) {
    throw "pg_dump nao encontrado. Instale PostgreSQL ou adicione bin ao PATH."
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$outFile = Join-Path $BackupDir "workapool_${timestamp}.dump"

Write-Host "[backup] Banco: $pgDb @ ${pgHost}:${pgPort}"
Write-Host "[backup] Destino: $outFile"

$env:PGPASSWORD = $pgPass
try {
    & $pgDump.Source `
        -h $pgHost -p $pgPort -U $pgUser -d $pgDb `
        -Fc --no-owner --no-acl `
        -f $outFile

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump falhou com codigo $LASTEXITCODE"
    }

    $sizeMb = [math]::Round((Get-Item $outFile).Length / 1MB, 2)
    Write-Host "[backup] OK ($sizeMb MB)"
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

if ($KeepDays -gt 0) {
    $cutoff = (Get-Date).AddDays(-$KeepDays)
    Get-ChildItem $BackupDir -Filter "workapool_*.dump" |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        ForEach-Object {
            Write-Host "[backup] Removendo antigo: $($_.Name)"
            Remove-Item $_.FullName -Force
        }
}
