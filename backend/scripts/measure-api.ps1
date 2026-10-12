param(
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$Path = '/api/recruiter/applications/page?page=0&size=20&search=&state=',
    [ValidateRange(5,500)][int]$Samples = 30,
    [ValidateRange(0,50)][int]$Warmup = 5,
    [ValidateRange(1,60000)][int]$MaxP95Ms = 1000
)
$ErrorActionPreference = 'Stop'
$uri = [Uri]::new(([Uri]$BaseUrl), $Path)
if($uri.Host -notin @('localhost','127.0.0.1')) {
    throw 'This local QA tool only sends credentials to localhost.'
}
$token = $env:GTEL_QA_TOKEN
if([string]::IsNullOrWhiteSpace($token)) { throw 'Set GTEL_QA_TOKEN in this terminal.' }
$headers = @{ Authorization = "Bearer $token" }
1..$Warmup | ForEach-Object { Invoke-WebRequest -Uri $uri -Headers $headers -Method Get -UseBasicParsing | Out-Null }
$times = foreach($sample in 1..$Samples) {
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -Method Get -UseBasicParsing
    $timer.Stop()
    if($response.StatusCode -ne 200) { throw "Unexpected HTTP $($response.StatusCode)" }
    [double]$timer.Elapsed.TotalMilliseconds
}
$ordered = @($times | Sort-Object)
$p50 = $ordered[[Math]::Ceiling($ordered.Count * .50)-1]
$p95 = $ordered[[Math]::Ceiling($ordered.Count * .95)-1]
$result = [pscustomobject]@{
    Uri = $uri.AbsoluteUri
    Samples = $Samples
    MinimumMs = [Math]::Round($ordered[0],2)
    MedianMs = [Math]::Round($p50,2)
    P95Ms = [Math]::Round($p95,2)
    MaximumMs = [Math]::Round($ordered[-1],2)
    ThresholdP95Ms = $MaxP95Ms
    Passed = $p95 -le $MaxP95Ms
}
$result
if(-not $result.Passed) { throw "P95 exceeded $MaxP95Ms ms." }

