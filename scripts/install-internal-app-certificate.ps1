[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$CertificatePath,
    [string]$ExpectedSubject = 'CN=WebcamViewer Internal'
)

$ErrorActionPreference = 'Stop'

$isAdministrator = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdministrator) {
    throw 'Run PowerShell as Administrator, then run this script again. The certificate is installed for this computer, not only the current account.'
}

$resolvedCertificatePath = (Resolve-Path -LiteralPath $CertificatePath).Path
if ([IO.Path]::GetExtension($resolvedCertificatePath) -ne '.cer') {
    throw 'Only the public .cer certificate may be installed. Do not copy or install the private .pfx file on recipient PCs.'
}

$certificate = [Security.Cryptography.X509Certificates.X509Certificate2]::new($resolvedCertificatePath)
if ($certificate.Subject -ne $ExpectedSubject) {
    throw "Unexpected certificate subject '$($certificate.Subject)'. Expected '$ExpectedSubject'."
}

$existing = Get-ChildItem -Path Cert:\LocalMachine\TrustedPeople | Where-Object Thumbprint -eq $certificate.Thumbprint
if ($null -eq $existing) {
    Import-Certificate -FilePath $resolvedCertificatePath -CertStoreLocation 'Cert:\LocalMachine\TrustedPeople' | Out-Null
    Write-Host "Installed '$($certificate.Subject)' in Local Computer > Trusted People." -ForegroundColor Green
}
else {
    Write-Host "The required certificate is already trusted on this PC." -ForegroundColor Green
}

Write-Host 'You can now install a WebcamViewer .appx package signed by this certificate.'
