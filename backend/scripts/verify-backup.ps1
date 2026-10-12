param([Parameter(Mandatory=$true)][string]$Backup)
$ErrorActionPreference='Stop'
$target=[IO.Path]::GetFullPath($Backup)
$record=Get-Content -LiteralPath "$target.sha256.json" -Raw | ConvertFrom-Json
if($record.version -ne 1 -or $record.sha256 -notmatch '^[A-Fa-f0-9]{64}$'){throw 'Invalid manifest'}
$file=Get-Item -LiteralPath $target
if($record.file -cne $file.Name -or [long]$record.bytes -ne $file.Length){throw 'Backup metadata mismatch'}
if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $record.sha256){throw 'Backup integrity check failed'}
[pscustomobject]@{Backup=$target;Integrity='Verified';RestoreVerified=$false}
# Integrity is not authenticity: an attacker able to replace both files can replace the hash.
# Keep the manifest in separate protected storage and complete an isolated restore drill.