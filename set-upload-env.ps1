$ErrorActionPreference = "Stop"

# ===== Config =====
# Edit these values directly in this file.
$RemoteHost = "1.1.1.1"
$SessionOnly = $false
# =============

if ([string]::IsNullOrWhiteSpace($RemoteHost)) {
    throw "RemoteHost cannot be empty."
}

$env:MYWEB_REMOTE_HOST = $RemoteHost
Write-Host "Set in current session: MYWEB_REMOTE_HOST=$RemoteHost" -ForegroundColor Green

if (-not $SessionOnly) {
    [Environment]::SetEnvironmentVariable("MYWEB_REMOTE_HOST", $RemoteHost, "User")
    Write-Host "Persisted to user environment variable (effective in new PowerShell sessions)." -ForegroundColor Cyan
} else {
    Write-Host "Session only. Value will be lost after closing this terminal." -ForegroundColor Yellow
}
