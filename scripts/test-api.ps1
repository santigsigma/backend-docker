# API Testing Script - PowerShell (Windows)
# Uso: .\scripts\test-api.ps1 -Port 8080
# Ejemplo:
#   .\scripts\test-api.ps1
#   .\scripts\test-api.ps1 -Port 8080

[CmdletBinding()]
param(
    [int]$Port = 8080
)

$API_HOST = "http://localhost"
$API_URL = "$API_HOST`:$Port"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Backend API" -ForegroundColor Cyan
Write-Host "URL: $API_URL" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Función para hacer requests
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data,
        [string]$Description
    )

    Write-Host "[TEST] $Description" -ForegroundColor Yellow
    Write-Host "$Method $Endpoint" -ForegroundColor Cyan

    try {
        $Uri = "$API_URL$Endpoint"
        
        if ([string]::IsNullOrEmpty($Data)) {
            $response = Invoke-WebRequest -Uri $Uri -Method $Method `
                -Headers @{"Content-Type" = "application/json"} `
                -UseBasicParsing
        } else {
            Write-Host "Data: $Data" -ForegroundColor Cyan
            $response = Invoke-WebRequest -Uri $Uri -Method $Method `
                -Headers @{"Content-Type" = "application/json"} `
                -Body $Data `
                -UseBasicParsing
        }

        $http_code = [int]$response.StatusCode
        $body = $response.Content

        if ($http_code -ge 200 -and $http_code -lt 300) {
            Write-Host "✓ Status: $http_code" -ForegroundColor Green
        } else {
            Write-Host "✗ Status: $http_code" -ForegroundColor Red
        }

        Write-Host "Response:"
        try {
            $body | ConvertFrom-Json | ConvertTo-Json -Depth 4
        } catch {
            Write-Host $body
        }
        Write-Host ""
    }
    catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Test 1: Health Check
Test-Endpoint -Method GET -Endpoint "/health" -Data $null -Description "Health Check (sin BD)"

# Test 2: DB Status
Test-Endpoint -Method GET -Endpoint "/db-status" -Data $null -Description "DB Status (con consulta BD)"

# Test 3: Get Items (inicial)
Test-Endpoint -Method GET -Endpoint "/items" -Data $null -Description "Listar Items (inicial)"

# Test 4: Create Item
Test-Endpoint -Method POST -Endpoint "/items" -Data '{"nombre":"Item de Prueba"}' -Description "Crear nuevo Item"

# Test 5: Get Items (con item creado)
Test-Endpoint -Method GET -Endpoint "/items" -Data $null -Description "Listar Items (con datos)"

# Test 6: Create otro item
Test-Endpoint -Method POST -Endpoint "/items" -Data '{"nombre":"Segundo Item de Test"}' -Description "Crear segundo Item"

# Test 7: Get Items final
Test-Endpoint -Method GET -Endpoint "/items" -Data $null -Description "Listar Items (final)"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✓ Tests completados" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
