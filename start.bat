@echo off
setlocal

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "BACKEND_VENV_PYTHON=%BACKEND_DIR%\.venv\Scripts\python.exe"
set "BACKEND_RUNNER="
set "BACKEND_PORT=8001"
set "BACKEND_URL=http://localhost:%BACKEND_PORT%"

if not exist ".env" (
    echo [ERRO] Arquivo .env nao encontrado na raiz do projeto.
    echo Copie .env.example para .env e defina POSTGRES_PASSWORD.
    exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Docker nao encontrado no PATH.
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Python nao encontrado no PATH.
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERRO] npm nao encontrado no PATH.
    exit /b 1
)

where uv >nul 2>nul
if not errorlevel 1 (
    set "BACKEND_RUNNER=uv"
)

if not defined BACKEND_RUNNER (
    if not exist "%BACKEND_VENV_PYTHON%" (
        echo [INFO] uv nao encontrado. Criando ambiente virtual do backend...
        pushd "%BACKEND_DIR%"
        python -m venv .venv
        if errorlevel 1 (
            popd
            echo [ERRO] Falha ao criar o ambiente virtual do backend.
            exit /b 1
        )
        "%BACKEND_VENV_PYTHON%" -m pip install --upgrade pip
        if errorlevel 1 (
            popd
            echo [ERRO] Falha ao atualizar o pip do backend.
            exit /b 1
        )
        popd
    )
)

echo [INFO] Garantindo dependencias do backend...
pushd "%BACKEND_DIR%"
if defined BACKEND_RUNNER (
    uv sync
) else (
    "%BACKEND_VENV_PYTHON%" -m pip install -e .[dev]
)
if errorlevel 1 (
    popd
    echo [ERRO] Falha ao instalar as dependencias do backend.
    exit /b 1
)
popd

echo [1/4] Subindo PostgreSQL no Docker...
docker compose up -d postgres
if errorlevel 1 (
    echo [ERRO] Falha ao subir o PostgreSQL.
    exit /b 1
)

echo [2/4] Aplicando migrations do backend...
pushd "%BACKEND_DIR%"
if defined BACKEND_RUNNER (
    uv run python -m alembic upgrade head
) else (
    "%BACKEND_VENV_PYTHON%" -m alembic upgrade head
)
if errorlevel 1 (
    popd
    echo [ERRO] Falha ao aplicar migrations do backend.
    exit /b 1
)
popd

echo [3/4] Iniciando backend...
if defined BACKEND_RUNNER (
    start "Valora Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && uv run uvicorn valora_backend.main:app --reload --port %BACKEND_PORT%"
) else (
    start "Valora Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && ""%BACKEND_VENV_PYTHON%"" -m uvicorn valora_backend.main:app --reload --port %BACKEND_PORT%"
)

echo [4/4] Iniciando frontend...
start "Valora Frontend" cmd /k "cd /d ""%ROOT_DIR%frontend"" && set NEXT_PUBLIC_API_URL=%BACKEND_URL% && npm run dev"

echo.
echo Ambiente iniciado.
echo Backend:  %BACKEND_URL%
echo Frontend: http://localhost:3000
