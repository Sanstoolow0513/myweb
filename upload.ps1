# upload.ps1
# Run from project root:
# powershell -ExecutionPolicy Bypass -File .\upload.ps1
# or:
# .\upload.ps1

param(
    [string]$RemoteHost = $env:MYWEB_REMOTE_HOST
)

$ErrorActionPreference = "Stop"

# ===== Config =====
$ArchiveName = "myweb.tar.gz"
$RemoteUser  = "blogger"
$RemotePath  = "/tmp/"
$LogPath     = Join-Path $PSScriptRoot "deploy.log"
# =============

if ([string]::IsNullOrWhiteSpace($RemoteHost)) {
    throw "Remote host is not set. Run .\\set-upload-env.ps1 -RemoteHost ""your.host.or.ip"" or pass -RemoteHost directly."
}

function Require-Command([string]$cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "Missing command: $cmd. Ensure it is installed and available in PATH."
    }
}

function Run([string]$name, [scriptblock]$action) {
    Write-Host ">> $name" -ForegroundColor Cyan
    ">> $name" | Out-File -FilePath $LogPath -Encoding UTF8 -Append
    $out = & $action 2>&1
    $out | Out-File -FilePath $LogPath -Encoding UTF8 -Append
    Write-Host "   OK" -ForegroundColor Green
}

"===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') START =====" | Out-File -FilePath $LogPath -Encoding UTF8 -Append

try {
    Require-Command "tar"
    Require-Command "scp"

    $ArchivePath = Join-Path $PSScriptRoot $ArchiveName

    # Remove old archive first to avoid ambiguous tar behavior.
    if (Test-Path $ArchivePath) {
        Remove-Item -Force $ArchivePath
    }

    Set-Location $PSScriptRoot

    Run "Create archive $ArchiveName (excluding node_modules/.next/.git)" {
        tar -czf $ArchiveName --exclude=node_modules --exclude=.next --exclude=.git .
    }

    Run "Upload to $RemoteUser@${RemoteHost}:$RemotePath" {
        scp $ArchivePath "$RemoteUser@${RemoteHost}:$RemotePath"
    }

    Write-Host "Done. Remote location: $RemoteUser@${RemoteHost}:$RemotePath$ArchiveName" -ForegroundColor Yellow
}
catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath $LogPath -Encoding UTF8 -Append
    exit 1
}
finally {
    "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') END =====" | Out-File -FilePath $LogPath -Encoding UTF8 -Append
}
