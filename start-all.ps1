# 🚀 快速启动脚本
# 同时启动前端和后端服务器

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  🚀 LLM Adaptor 启动脚本" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否已有服务器在运行
$frontendRunning = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    (netstat -ano | Select-String -Pattern "LISTENING.*$($_.Id)" | Select-String -Pattern ":5173").Count -gt 0 
}

$backendRunning = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    (netstat -ano | Select-String -Pattern "LISTENING.*$($_.Id)" | Select-String -Pattern ":3003").Count -gt 0 
}

if ($frontendRunning) {
    Write-Host "✅ 前端服务器已在运行 (端口 5173)" -ForegroundColor Green
} else {
    Write-Host "🔄 启动前端开发服务器..." -ForegroundColor Yellow
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"
    Start-Sleep -Seconds 3
}

if ($backendRunning) {
    Write-Host "✅ 后端服务器已在运行 (端口 3003)" -ForegroundColor Green
} else {
    Write-Host "🔄 启动后端代理服务器..." -ForegroundColor Yellow
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend-proxy'; node server.js"
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  ✅ 服务器启动完成！" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 访问地址:" -ForegroundColor Yellow
Write-Host "   前端测试页面: http://localhost:5173/" -ForegroundColor White
Write-Host "   后端代理服务: http://localhost:3003/" -ForegroundColor White
Write-Host ""
Write-Host "📋 快速测试指南:" -ForegroundColor Yellow
Write-Host "   1. Chrome AI    - 无需配置，直接点击 Connect" -ForegroundColor White
Write-Host "   2. LM Studio    - 确保 LM Studio 运行在 127.0.0.1:1234" -ForegroundColor White
Write-Host "   3. Silicon Flow - 输入 API Key (从 siliconflow.cn 获取)" -ForegroundColor White
Write-Host "   4. Backend Proxy- 在 backend-proxy/.env 配置 API Keys" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示: 按 Ctrl+C 可停止当前终端中的服务器" -ForegroundColor Cyan
Write-Host ""

# 等待用户按键
Write-Host "按任意键在浏览器中打开测试页面..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 打开浏览器
Start-Process "http://localhost:5173/"
