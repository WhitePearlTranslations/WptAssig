# Script para generar tráfico aleatorio al Worker
# Presiona Ctrl+C para detener

$workerUrl = "https://wpt-config-api.whitepearltranslations.workers.dev"
$endpoints = @("/health", "/metrics", "/firebase-config")
$counter = 0

Write-Host "🚀 Generando tráfico infinito al Worker..." -ForegroundColor Green
Write-Host "📊 URL: $workerUrl" -ForegroundColor Cyan
Write-Host "⏹️  Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    # Seleccionar endpoint aleatorio
    $endpoint = $endpoints | Get-Random
    
    # Delay aleatorio entre 100ms y 2000ms
    $delay = Get-Random -Minimum 100 -Maximum 2000
    
    # Hacer request
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
    
    # Esperar delay aleatorio
    Start-Sleep -Milliseconds $delay
}
