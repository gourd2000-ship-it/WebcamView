# 이 스크립트는 관리자 권한으로 실행되어야 합니다.
Write-Host "Checking Administrator privileges..." -ForegroundColor Cyan
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "이 스크립트는 반드시 '관리자 권한'으로 실행해야 합니다. PowerShell을 관리자 권한으로 실행한 후 다시 시도해 주세요."
    Exit
}

$certSubject = "CN=WebcamViewer Local Dev"
$certFriendlyName = "WebcamViewer Local CodeSign"
$pfxPath = Join-Path (Get-Location) "webcamviewer-private.pfx"
$pfxPassword = ConvertTo-SecureString "localpassword" -AsPlainText -Force

Write-Host "1. Generating Self-Signed Code Signing Certificate..." -ForegroundColor Cyan
$cert = New-SelfSignedCertificate -Type CodeSigningCert `
                                  -Subject $certSubject `
                                  -KeyUsage DigitalSignature `
                                  -FriendlyName $certFriendlyName `
                                  -CertStoreLocation "Cert:\CurrentUser\My" `
                                  -NotAfter (Get-Date).AddYears(5)

Write-Host "Certificate generated successfully. Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

Write-Host "2. Exporting Certificate to PFX file: $pfxPath..." -ForegroundColor Cyan
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPassword

Write-Host "PFX file exported successfully." -ForegroundColor Green

Write-Host "3. Importing Certificate into Local Machine Trust Stores..." -ForegroundColor Cyan
# Export to CER for machine import
$cerPath = Join-Path $env:TEMP "local_codesign.cer"
Export-Certificate -Cert $cert -FilePath $cerPath

# Import into Trusted Root Certification Authorities (Root)
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\LocalMachine\Root"
# Import into Trusted Publishers (TrustedPublisher)
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\LocalMachine\TrustedPublisher"

# Clean up CER
Remove-Item $cerPath -ErrorAction SilentlyContinue

Write-Host "Certificate imported into Local Machine Trust Stores successfully!" -ForegroundColor Green
Write-Host "Now, electron-builder will automatically sign the app during 'npm run package'." -ForegroundColor Green
Write-Host "Since this certificate is trusted on your PC, Windows Smart App Control and SmartScreen will allow the app to run without warnings!" -ForegroundColor Yellow
