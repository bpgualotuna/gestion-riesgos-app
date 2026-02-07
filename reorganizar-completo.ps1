# Script completo de reorganización y limpieza del proyecto

$srcPath = "src"

Write-Host "=== REORGANIZACIÓN COMPLETA DEL PROYECTO ===" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Eliminar carpetas vacías duplicadas
Write-Host "1. Limpiando carpetas vacías..." -ForegroundColor Yellow
$emptyDirs = @(
    "$srcPath\components",
    "$srcPath\contexts", 
    "$srcPath\hooks",
    "$srcPath\utils"
)

foreach ($dir in $emptyDirs) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Path $dir -Recurse -File -ErrorAction SilentlyContinue
        if ($files.Count -eq 0) {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Eliminada: $dir" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Manteniendo: $dir (contiene archivos)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "2. Verificando estructura de shared..." -ForegroundColor Yellow
$sharedDirs = @(
    "$srcPath\shared\components\ui",
    "$srcPath\shared\components\layout",
    "$srcPath\shared\hooks",
    "$srcPath\shared\contexts",
    "$srcPath\shared\utils"
)

foreach ($dir in $sharedDirs) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem -Path $dir -File -ErrorAction SilentlyContinue).Count
        Write-Host "  ✓ $dir ($fileCount archivos)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ FALTA: $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Verificando estructura de features..." -ForegroundColor Yellow
$featuresDirs = @(
    "$srcPath\features\gestion-riesgos\pages\procesos",
    "$srcPath\features\gestion-riesgos\pages\riesgos",
    "$srcPath\features\gestion-riesgos\pages\controles",
    "$srcPath\features\gestion-riesgos\pages\supervision",
    "$srcPath\features\gestion-riesgos\pages\eventos",
    "$srcPath\features\gestion-riesgos\pages\otros"
)

foreach ($dir in $featuresDirs) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem -Path $dir -File -ErrorAction SilentlyContinue).Count
        Write-Host "  ✓ $dir ($fileCount archivos)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ FALTA: $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== REORGANIZACIÓN COMPLETADA ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Estructura final:" -ForegroundColor Yellow
Write-Host "  src/" -ForegroundColor White
Write-Host "    ├── app/          (configuración)" -ForegroundColor White
Write-Host "    ├── shared/        (código compartido)" -ForegroundColor White
Write-Host "    │   ├── components/" -ForegroundColor White
Write-Host "    │   ├── contexts/" -ForegroundColor White
Write-Host "    │   ├── hooks/" -ForegroundColor White
Write-Host "    │   └── utils/" -ForegroundColor White
Write-Host "    └── features/     (módulos funcionales)" -ForegroundColor White
Write-Host "        ├── auth/" -ForegroundColor White
Write-Host "        ├── admin/" -ForegroundColor White
Write-Host "        ├── dashboard/" -ForegroundColor White
Write-Host "        └── gestion-riesgos/" -ForegroundColor White
Write-Host "            └── pages/" -ForegroundColor White
Write-Host "                ├── procesos/" -ForegroundColor White
Write-Host "                ├── riesgos/" -ForegroundColor White
Write-Host "                ├── controles/" -ForegroundColor White
Write-Host "                ├── supervision/" -ForegroundColor White
Write-Host "                ├── eventos/" -ForegroundColor White
Write-Host "                └── otros/" -ForegroundColor White

