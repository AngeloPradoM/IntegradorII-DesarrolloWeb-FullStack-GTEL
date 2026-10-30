$ErrorActionPreference = 'Stop'

$databaseName = 'gtel_talento'
$confirmation = Read-Host "Esto ELIMINARÁ la base local '$databaseName'. Escribe exactamente '$databaseName' para continuar"
if ($confirmation -cne $databaseName) {
    throw 'Confirmación incorrecta. No se ejecutó ningún comando de MySQL.'
}

$mysqlCommand = Get-Command mysql.exe -ErrorAction Stop
$mysqlHost = if ([string]::IsNullOrWhiteSpace($env:MYSQL_HOST)) { '127.0.0.1' } else { $env:MYSQL_HOST }
if ($mysqlHost -notin @('127.0.0.1', 'localhost', '::1')) {
    throw 'reset-local-db.ps1 solo acepta MySQL local (localhost, 127.0.0.1 o ::1).'
}
$mysqlPort = if ([string]::IsNullOrWhiteSpace($env:MYSQL_PORT)) { '3306' } else { $env:MYSQL_PORT }
$mysqlUser = $env:MYSQL_USER
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = Read-Host 'Usuario MySQL'
}
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    throw 'Se requiere MYSQL_USER o un usuario MySQL ingresado en el prompt.'
}

$setPasswordForProcess = [string]::IsNullOrWhiteSpace($env:MYSQL_PWD)
$securePassword = $null
$passwordPointer = [IntPtr]::Zero
if ($setPasswordForProcess) {
    $securePassword = Read-Host 'Contraseña MySQL' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$previousOutputEncoding = $OutputEncoding
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$mysqlArguments = @(
    "--host=$mysqlHost",
    "--port=$mysqlPort",
    "--user=$mysqlUser",
    '--default-character-set=utf8mb4'
)

Push-Location $repoRoot
try {
    & $mysqlCommand.Source @mysqlArguments '--execute=DROP DATABASE IF EXISTS gtel_talento;'
    if ($LASTEXITCODE -ne 0) { throw "MySQL falló al eliminar la base (código $LASTEXITCODE)." }

    Get-Content -LiteralPath 'database/schema/gtel_talento.sql' -Raw -Encoding UTF8 | & $mysqlCommand.Source @mysqlArguments
    if ($LASTEXITCODE -ne 0) { throw "MySQL falló al cargar database/schema/gtel_talento.sql (código $LASTEXITCODE)." }

    Get-Content -LiteralPath 'database/scripts/check-schema.sql' -Raw -Encoding UTF8 | & $mysqlCommand.Source @mysqlArguments 'gtel_talento'
    if ($LASTEXITCODE -ne 0) { throw "MySQL falló al ejecutar check-schema.sql (código $LASTEXITCODE)." }
}
finally {
    Pop-Location
    $OutputEncoding = $previousOutputEncoding
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    if ($null -ne $securePassword) { $securePassword.Dispose() }
    if ($setPasswordForProcess) { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
}

Write-Host "Base '$databaseName' recreada; revisa los conteos del verificador anterior."
