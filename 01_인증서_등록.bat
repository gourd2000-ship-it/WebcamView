@echo off
setlocal EnableExtensions

set "CERTIFICATE_FILE=%~dp0webcamviewer-internal-signing.cer"

if not exist "%CERTIFICATE_FILE%" (
    echo Public certificate not found: "%CERTIFICATE_FILE%"
    echo Copy webcamviewer-internal-signing.cer into this same folder, then run this file again.
    exit /b 2
)

powershell.exe -NoProfile -Command "$principal = [Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent(); if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 1 }"
if errorlevel 1 (
    echo Right-click this file and choose "Run as administrator".
    exit /b 3
)

powershell.exe -NoProfile -Command "$certificate = [Security.Cryptography.X509Certificates.X509Certificate2]::new($args[0]); if ($certificate.Subject -ne 'CN=WebcamViewer Internal') { exit 1 }" "%CERTIFICATE_FILE%"
if errorlevel 1 (
    echo The certificate is not a WebcamViewer Internal public certificate. Nothing was changed.
    exit /b 4
)

certutil.exe -addstore -f TrustedPeople "%CERTIFICATE_FILE%" >nul
if errorlevel 1 (
    echo Certificate registration failed. No app was installed.
    exit /b 5
)

echo.
echo Certificate registration completed for this PC.
echo Next: open 02_WebcamViewer.appx in this folder and select Install.
exit /b 0
