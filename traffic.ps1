$workerUrl = "https://wpt-config-api.whitepearltranslations.workers.dev"
$endpoints = @("/health", "/metrics", "/firebase-config")
$counter = 0

Write-Host "Generando trafico infinito al Worker..." -ForegroundColor Green
Write-Host "URL: $workerUrl" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    $endpoint = $endpoints | Get-Random
    $delay = Get-Random -Minimum 100 -Maximum 2000
    
    try {
        $response = Invoke-WebRequest -Uri "$workerUrl$endpoint" -UseBasicParsing -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode
        $statusColor = "Green"
    } catch {
        $statusCode = 500
        $statusColor = "Red"
    }
    
    $counter++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Write-Host "[$timestamp] Request #$counter -> $endpoint " -NoNewline
    Write-Host "[$statusCode]" -ForegroundColor $statusColor
    
    Start-Sleep -Milliseconds $delay
}
