param([string]$LoginPath='gtel',[string]$Database='gtel_talento',[Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference='Stop'
if($Database -notmatch '^[A-Za-z0-9_]+$'){throw 'Invalid database name'}
$target=[IO.Path]::GetFullPath($Destination)
$manifest="$target.sha256.json"
if((Test-Path -LiteralPath $target) -or (Test-Path -LiteralPath $manifest)){throw 'Destination already exists; choose a new file'}
$parent=Split-Path -Parent $target
if(-not (Test-Path -LiteralPath $parent -PathType Container)){throw 'Create the private backup directory first'}
Get-Command mysqldump -ErrorAction Stop | Out-Null
# Failed output remains explicitly partial; it is never published as a valid backup.
$partial="$target.$([guid]::NewGuid().ToString('N')).partial"
& mysqldump "--login-path=$LoginPath" --single-transaction --routines --triggers --hex-blob --no-tablespaces "--result-file=$partial" $Database
if($LASTEXITCODE -ne 0){throw 'Backup failed; partial output is not a usable backup'}
if(-not (Test-Path -LiteralPath $partial) -or (Get-Item -LiteralPath $partial).Length -eq 0){throw 'Backup produced no data'}
$hash=(Get-FileHash -LiteralPath $partial -Algorithm SHA256).Hash
$bytes=(Get-Item -LiteralPath $partial).Length
[IO.File]::Move($partial,$target)
$record=[ordered]@{version=1;database=$Database;file=[IO.Path]::GetFileName($target);bytes=$bytes;sha256=$hash;createdUtc=[DateTime]::UtcNow.ToString('o');restoreVerified=$false}
# CreateNew prevents concurrent runs from overwriting existing evidence.
$stream=[IO.File]::Open($manifest,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write)
try {
    $data=[Text.Encoding]::UTF8.GetBytes(($record | ConvertTo-Json))
    $stream.Write($data,0,$data.Length)
} finally { $stream.Dispose() }
[pscustomobject]@{Backup=$target;Manifest=$manifest;Integrity='SHA256 recorded';RestoreVerified=$false}