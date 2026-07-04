# Configure npm trusted publisher for GitHub Actions OIDC publishing.
# Requires npm CLI v11+ and an authenticated npm account (package owner).
#
# Usage (PowerShell):
#   $env:NPM_TOKEN = "npm_..."
#   ./scripts/configure-npm-trust.ps1
#
# Usage (bash):
#   NPM_TOKEN=npm_... ./scripts/configure-npm-trust.sh

$ErrorActionPreference = "Stop"

$package = "template-create-ts"
$repo = "Masterofowls/template-create-ts"
$workflow = "publish.yml"

if (-not $env:NPM_TOKEN) {
  Write-Error "Set NPM_TOKEN to a granular npm token with publish permissions."
}

$npmrc = Join-Path $env:TEMP "npmrc-trust-$(Get-Random)"
"//registry.npmjs.org/:_authToken=$($env:NPM_TOKEN)" | Set-Content -Path $npmrc -NoNewline

try {
  npx npm@11 trust github $package `
    --file $workflow `
    --repo $repo `
    --allow-publish `
    -y `
    --userconfig $npmrc
  Write-Host "Trusted publisher configured for $package via $workflow on $repo"
}
finally {
  Remove-Item $npmrc -Force -ErrorAction SilentlyContinue
}
