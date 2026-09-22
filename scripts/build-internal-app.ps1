[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$PfxPath,
    [Security.SecureString]$PfxPassword
)

$ErrorActionPreference = 'Stop'

$resolvedPfxPath = (Resolve-Path -LiteralPath $PfxPath).Path
if ([IO.Path]::GetExtension($resolvedPfxPath) -ne '.pfx') {
    throw 'PfxPath must point to the private .pfx signing certificate.'
}

if ($null -eq $PfxPassword) {
    Write-Host 'Enter the PFX password. It is kept only for this build process.' -ForegroundColor Cyan
    $PfxPassword = Read-Host -AsSecureString 'PFX password'
}
$passwordHandle = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($PfxPassword)

$hadCscLink = Test-Path Env:CSC_LINK
$hadCscKeyPassword = Test-Path Env:CSC_KEY_PASSWORD
$previousCscLink = $env:CSC_LINK
$previousCscKeyPassword = $env:CSC_KEY_PASSWORD

try {
    $env:CSC_LINK = $resolvedPfxPath
    $env:CSC_KEY_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordHandle)

    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Application build failed with exit code $LASTEXITCODE."
    }

    & npx electron-builder --win appx --x64
    if ($LASTEXITCODE -ne 0) {
        throw "Signed AppX packaging failed with exit code $LASTEXITCODE."
    }
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordHandle)

    if ($hadCscLink) {
        $env:CSC_LINK = $previousCscLink
    }
    else {
        Remove-Item Env:CSC_LINK -ErrorAction SilentlyContinue
    }

    if ($hadCscKeyPassword) {
        $env:CSC_KEY_PASSWORD = $previousCscKeyPassword
    }
    else {
        Remove-Item Env:CSC_KEY_PASSWORD -ErrorAction SilentlyContinue
    }

}

$artifact = Get-ChildItem -Path (Join-Path $PSScriptRoot '..\dist-packaged') -Filter '*.appx' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $artifact) {
    throw 'electron-builder completed but no .appx artifact was found.'
}

Write-Host "Internal distribution package created: $($artifact.FullName)" -ForegroundColor Green
