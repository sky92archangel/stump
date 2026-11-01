# Stump 一键启动脚本（后端 + 前端）
# 用法：在仓库根目录执行  .\start-server.ps1
# 说明：后端必须在 VS 编译环境中运行（aws-lc-sys 等依赖需要 MSVC），
#       且每次都用本脚本启动，避免在普通终端中运行 cargo 导致构建缓存失效、全量重编。

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# --- 加载 VS 编译环境（后端编译必需） ---
& "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1" -Arch amd64
$env:CMAKE_GENERATOR = "Ninja"
$env:PATH = "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\Ninja;" + $env:PATH

# --- 启动前端（Vite dev server，http://localhost:3000） ---
Start-Process powershell -ArgumentList '-NoExit', '-Command', `
	"Set-Location '$PSScriptRoot'; corepack yarn workspace @stump/web dev"

# --- 启动后端（stump_server，http://127.0.0.1:10801，当前窗口内运行） ---
Write-Host ""
Write-Host "前端已在新的 PowerShell 窗口启动 (http://localhost:3000)" -ForegroundColor Green
Write-Host "后端开始编译/启动 (http://127.0.0.1:10801) ..." -ForegroundColor Green
cargo run -p stump_server

