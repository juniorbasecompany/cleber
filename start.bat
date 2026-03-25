@echo off
CLS
REM Portas padrao de desenvolvimento: frontend 3003 e backend 8003.
REM Em frontend/.env.local defina NEXT_PUBLIC_API_URL=http://127.0.0.1:8003 (ou localhost).
REM Apos alterar .env.local, reinicie o npm run dev.
set "BACKEND_PORT=8003"
set "BACKEND_PID="
cd /d "%~dp0"
docker compose up -d --wait
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%BACKEND_PORT% .*LISTENING"') do (
    if not defined BACKEND_PID set "BACKEND_PID=%%P"
)

if defined BACKEND_PID (
    echo Porta %BACKEND_PORT% ja esta em uso por PID %BACKEND_PID%. Ignorando novo uvicorn.
    echo Se esse processo nao for a API do Valora, finalize-o e execute start.bat novamente.
) else (
    cd backend
    start /B "" .\.venv\Scripts\python.exe -m uvicorn valora_backend.main:app --port %BACKEND_PORT%
    cd ..
)

cd frontend
npm run dev
