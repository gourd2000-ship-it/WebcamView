[CmdletBinding()]
param(
    [string]$Subject = 'CN=WebcamViewer Internal',
    [string]$OutputDirectory = (Join-Path $env:LOCALAPPDATA 'WebcamViewer\signing'),
    [ValidateRange(1, 10)]
    [int]$ValidYears = 5,
    [Security.SecureString]$PfxPassword
)

$ErrorActionPreference = 'Stop'

if ($Subject -notmatch '^CN=[^,]+$') {
    throw 'Subject must have exactly one common name, for example: CN=WebcamViewer Internal'
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$pfxPath = Join-Path $OutputDirectory 'webcamviewer-internal-signing.pfx'
$cerPath = Join-Path $OutputDirectory 'webcamviewer-internal-signing.cer'

if ((Test-Path -LiteralPath $pfxPath) -or (Test-Path -LiteralPath $cerPath)) {
    throw "A signing certificate already exists in '$OutputDirectory'. Do not overwrite it: future updates must use the same certificate."
}

if ($null -eq $PfxPassword) {
    Write-Host 'Create and record a strong PFX password. The password is requested only on this computer.' -ForegroundColor Cyan
    $PfxPassword = Read-Host -AsSecureString 'PFX password'
}

$certificate = $null
try {
    $certificate = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject $Subject `
        -FriendlyName 'WebcamViewer internal package signing' `
        -KeyAlgorithm RSA `
        -KeyLength 3072 `
        -HashAlgorithm SHA256 `
        -KeyExportPolicy Exportable `
        -CertStoreLocation 'Cert:\CurrentUser\My' `
        -NotAfter (Get-Date).AddYears($ValidYears) `
        -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3')

    Export-PfxCertificate -Cert $certificate -FilePath $pfxPath -Password $PfxPassword | Out-Null
    Export-Certificate -Cert $certificate -FilePath $cerPath | Out-Null
}
catch {
    Remove-Item -LiteralPath $pfxPath, $cerPath -Force -ErrorAction SilentlyContinue
    throw
}
finally {
    if ($null -ne $certificate) {
        Remove-Item -LiteralPath "Cert:\CurrentUser\My\$($certificate.Thumbprint)" -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ''
Write-Host 'Certificate created.' -ForegroundColor Green
Write-Host "  Public certificate (.cer): $cerPath"
Write-Host "  Private signing key (.pfx): $pfxPath"
Write-Host "  Thumbprint: $($certificate.Thumbprint)"
Write-Host ''
Write-Warning 'Share only the .cer file with recipient PCs. Never share the .pfx file or its password.'
