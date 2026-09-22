$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$certificateBatch = Join-Path $repoRoot '01_인증서_등록.bat'

Describe 'two-step internal distribution' {
    It 'stops before changing trust when the public certificate is absent' {
        $testDirectory = Join-Path $env:TEMP ("webcamviewer-cert-test-" + [guid]::NewGuid())
        New-Item -ItemType Directory -Path $testDirectory | Out-Null

        try {
            Copy-Item -LiteralPath $certificateBatch -Destination $testDirectory -ErrorAction Stop
            $output = & cmd.exe /d /c (Join-Path $testDirectory '01_인증서_등록.bat') 2>&1

            $LASTEXITCODE | Should Be 2
            ($output | Out-String) | Should Match 'Public certificate not found'
        }
        finally {
            Remove-Item -LiteralPath $testDirectory -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    It 'registers only the expected public CER in the Trusted People store' {
        $content = Get-Content -LiteralPath $certificateBatch -Raw -ErrorAction Stop

        $content | Should Match 'webcamviewer-internal-signing\.cer'
        $content | Should Match 'certutil\.exe -addstore -f TrustedPeople'
        $content | Should Not Match '(?i)\.pfx'
        $content | Should Not Match '(?i)Trusted Root'
    }
}
